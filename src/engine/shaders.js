export const VERTEX_SHADER = `
  attribute vec2 position;
  attribute vec2 texCoord;
  varying vec2 vTexCoord;
  
  uniform float uRotation;
  
  void main() {
    float c = cos(uRotation);
    float s = sin(uRotation);
    mat2 rot = mat2(c, -s, s, c);
    
    gl_Position = vec4(position, 0.0, 1.0);
    
    vec2 centered = texCoord - 0.5;
    vec2 rotated = rot * centered;
    vTexCoord = rotated + 0.5;
  }
`;

export const FRAGMENT_SHADER = `
  precision highp float;
  
  varying vec2 vTexCoord;
  uniform sampler2D uImage;
  uniform sampler2D uToneCurve;
  uniform int uHasCurve;
  
  // Tonal
  uniform float uExposure;
  uniform float uContrast;
  uniform float uHighlights;
  uniform float uShadows;
  uniform float uWhites;
  uniform float uBlacks;
  
  // Parametric Tone Curve
  uniform float uCurveHighlights;
  uniform float uCurveLights;
  uniform float uCurveDarks;
  uniform float uCurveShadows;
  
  uniform int uOutputMode; // 0=Normal, 1=Gamut, 2=Ink
  
  // Masks
  struct LinearMask {
      vec2 point;
  };
  
  // Color
  uniform float uTemp;
  uniform float uTint;
  uniform float uSaturation;
  uniform float uVibrance;

  // HSL Mixer (8 channels)
  uniform float uHueShifts[8];
  uniform float uSatShifts[8];
  uniform float uLumShifts[8];

  // Detail
  uniform float uSharpenAmount;
  uniform float uNoiseReduction;
  uniform vec2 uResolution;

  const vec3 Luma = vec3(0.2126, 0.7152, 0.0722);

  // CAT02 Matrices for chromatic adaptation (simplified white balance)
  // We use these to transform RGB -> LMS -> Scale -> RGB
  const mat3 M_CAT02 = mat3(
      0.7328, 0.4296, -0.1624,
      -0.7036, 1.6975, 0.0061,
      0.0030, 0.0136, 0.9834
  );
  const mat3 M_CAT02_INV = mat3(
      1.096124, -0.278869, 0.182745,
      0.454369, 0.473533, 0.072098,
      -0.009628, -0.005698, 1.015326
  );

  vec3 rgb2hsl(vec3 c) {
    float mx = max(max(c.r, c.g), c.b);
    float mn = min(min(c.r, c.g), c.b);
    float h, s, l = (mx + mn) / 2.0;

    if (mx == mn) {
      h = s = 0.0;
    } else {
      float d = mx - mn;
      s = l > 0.5 ? d / (2.0 - mx - mn) : d / (mx + mn);
      if (mx == c.r) h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
      else if (mx == c.g) h = (c.b - c.r) / d + 2.0;
      else h = (c.r - c.g) / d + 4.0;
      h /= 6.0;
    }
    return vec3(h, s, l);
  }

  float hue2rgb(float p, float q, float t) {
    if (t < 0.0) t += 1.0;
    if (t > 1.0) t -= 1.0;
    if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
    if (t < 1.0/2.0) return q;
    if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
    return p;
  }

  vec3 hsl2rgb(vec3 hsl) {
    vec3 rgb;
    if (hsl.y == 0.0) {
      rgb = vec3(hsl.z);
    } else {
      float q = hsl.z < 0.5 ? hsl.z * (1.0 + hsl.y) : hsl.z + hsl.y - hsl.z * hsl.y;
      float p = 2.0 * hsl.z - q;
      rgb.r = hue2rgb(p, q, hsl.x + 1.0/3.0);
      rgb.g = hue2rgb(p, q, hsl.x);
      rgb.b = hue2rgb(p, q, hsl.x - 1.0/3.0);
    }
    return rgb;
  }

  vec3 applyWhiteBalance(vec3 color, float temp, float tint) {
    // LMS Space Scaling
    // Temp (-1..1) scales L (Red) vs S (Blue)
    // Tint (-1..1) scales M (Green) vs Magenta
    
    vec3 lms = M_CAT02 * color;
    
    float scaleL = 1.0 + temp * 0.4; // Warmth
    float scaleS = 1.0 - temp * 0.4; // Coolness
    float scaleM = 1.0 - tint * 0.4; // Green/Magenta
    
    lms.x *= scaleL;
    lms.y *= scaleM;
    lms.z *= scaleS;
    
    return M_CAT02_INV * lms;
  }

  float getChannelWeight(float hue, float center) {
    float dist = abs(hue - center);
    if (dist > 0.5) dist = 1.0 - dist; 
    return max(0.0, 1.0 - dist * 8.0); 
  }

  vec3 applyParametricCurve(vec3 color) {
    float L = dot(color, Luma);
    if (L <= 0.001) return color; // Protect blacks
    
    // Masks
    // Shadows: 0.0 - 0.5, Peak 0.25
    float m_shadows = smoothstep(0.0, 0.25, L) * (1.0 - smoothstep(0.25, 0.5, L));
    
    // Darks: 0.25 - 0.75, Peak 0.5
    float m_darks = smoothstep(0.25, 0.5, L) * (1.0 - smoothstep(0.5, 0.75, L));
    
    // Lights: 0.5 - 1.0, Peak 0.75
    float m_lights = smoothstep(0.5, 0.75, L) * (1.0 - smoothstep(0.75, 1.0, L));
    
    // Highlights: 0.75 - 1.0+, Peak 1.0 (Open ended?)
    // User spec: smoothstep(0.75, 1.0, L)
    float m_highlights = smoothstep(0.75, 1.0, L);
    
    // Adjustments (Normalized -1..1 from uniform)
    // Formula:
    // s * ms * (0.18 - L) ...
    
    float diff = 
        uCurveShadows * m_shadows * (0.18 - L) +
        uCurveDarks * m_darks * (0.18 - L) +
        uCurveLights * m_lights * (1.0 - L) +
        uCurveHighlights * m_highlights * (1.0 - L);
        
    // L_new
    float L_new = L + diff;
    
    // Reconstruct RGB
    // RGB' = RGB * (L' / L)
    return color * (L_new / max(L, 0.0001));
  }

  uniform float uDistortion;

  void main() {
    // 0. Lens Distortion (Geometric)
    // Must happen before sampling.
    
    vec2 uv = vTexCoord;
    
    if (uDistortion != 0.0) {
        vec2 center = vec2(0.5, 0.5);
        vec2 rel = uv - center;
        float r2 = dot(rel, rel);
        
        // Simple 1-term distortion: uv_distorted = uv + uv * k * r^2
        // If uDistortion is small (-0.5 to 0.5)
        
        float k = uDistortion;
        
        // Inverse/Forward? 
        // We want to find "which pixel from source maps here".
        // Source is the distorted image? 
        // If we are simulating distortion: new_uv = uv * (1 + k*r2)
        // If we are correcting: We usually approximate or solve cubic.
        // For visual slider, simpler is better.
        // New sampling coordinate:
        
        // Barrel correction (expanding center) -> we sample closer to center?
        // Let's use: sample_pos = center + rel * (1.0 + k * r2)
        
        // Note: For aspect ratio correctness, 'rel' should be aspect-corrected?
        // uResolution is available.
        // If we treat UV as square 0..1, distortion is elliptical on non-square image.
        // Let's assume user accepts this for MVP or use uResolution to square it.
        
        float aspect = uResolution.x / uResolution.y;
        
        // To be simpler, just radial on UV space.
        
        uv = center + rel * (1.0 + k * r2);
    }
    
    // Check bounds
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0); // Black border
        return;
    }

    vec4 texColor = texture2D(uImage, uv);
    vec3 color = texColor.rgb;
    
    // --- MASK ACCUMULATION ---
    float accExposure = 0.0;
    float accContrast = 0.0;
    float accSaturation = 0.0;
    
    // Linear Masks
    for (int i=0; i<3; i++) {
        if (i >= uLinearCount) break;
        // Logic
        vec2 p = uLinearMasks[i].point;
        vec2 dir = uLinearMasks[i].direction;
        float feather = uLinearMasks[i].feather;
        
        // Project
        vec2 toPixel = uv - p;
        float dist = dot(toPixel, dir);
        
        // Gradient
        float alpha = smoothstep(-feather, feather, dist);
        // Invert logic
        if (uLinearMasks[i].invert > 0.5) alpha = 1.0 - alpha;
        
        accExposure += uLinearMasks[i].exposure * alpha;
        accContrast += uLinearMasks[i].contrast * alpha;
        accSaturation += uLinearMasks[i].saturation * alpha;
    }
    
    // Radial Masks
    for (int i=0; i<3; i++) {
        if (i >= uRadialCount) break;
        vec2 pos = uRadialMasks[i].pos;
        vec2 radii = uRadialMasks[i].radii;
        float feather = max(0.001, uRadialMasks[i].feather);
        
        // Elliptical distance
        vec2 dVec = (vTexCoord - pos);
        // Rotate? Not implementing rotation for radial yet for MVP simplicity
        // Just scale by radii
        // d = length(dVec / radii)
        float d = length(dVec / max(vec2(0.001), radii));
        
        // Circular gradient 1..0
        // smoothstep(1.0, 1.0 - feather, d) ? 
        // We want 1 at center (d=0). 0 at d=1.
        // And feathering at edge.
        // Let's say feather controls falloff curve?
        // Or simply: 1 - smoothstep(1.0 - feather, 1.0, d)
        // If feather is 0.5: smoothstep(0.5, 1.0, d). d=0->0, 1-0=1. d=1->1, 1-1=0.
        float alpha = 1.0 - smoothstep(1.0 - feather, 1.0 + feather, d);
        
        accExposure += uRadialMasks[i].exposure * alpha;
        accContrast += uRadialMasks[i].contrast * alpha;
        accSaturation += uRadialMasks[i].saturation * alpha;
    }
    
    // Apply Global + Local
    float finalExposure = uExposure + accExposure;
    float finalContrast = uContrast + accContrast;
    float finalSaturation = uSaturation + accSaturation;

    // 1. Exposure (2^EV)
    color *= pow(2.0, finalExposure);

    // 2. White Balance (LMS)
    color = applyWhiteBalance(color, uTemp, uTint);

    // 3. Contrast (Midtone-Anchored)
    color = (color - 0.18) * (1.0 + finalContrast) + 0.18;

    // 4. Highlights / Shadows (Split Luminance Masking)
    float luma = dot(color, Luma);
    
    // Highlights: smoothstep(0.5, 1.0, L)
    // User Formula: RGB_ut = RGB - mask * Highlight * (RGB - 1.0)
    // Correct interpretation: Highlights slider reduces highlights (Recovery).
    // If Highlight > 0, it darkens highlights. 
    // Wait, User Formula: RGB_ut = RGB_n - mask_h * Highlight * (RGB_n - 1.0)
    // If Highlight=1 (Max Recovery), RGB - 1*(RGB-1) = 1. Constant? No.
    // Let's assume Highlight slider is POSITIVE for Recovery (Dimming) or NEGATIVE for Blowing out.
    // Actually, usually "Highlights" slider -100 (Recover) to +100 (Brighten).
    // If uHighlights is -1..1.
    // If -1 (Recover): RGB - mask * (-1) * (RGB-1) = RGB + mask*(RGB-1). (Darkens as RGB-1 < 0).
    // If +1 (Brighten): RGB - mask * (1) * (RGB-1) = RGB + mask*(1-RGB). (Brightens).
    // So this formula works for standard slider behavior.
    float mask_h = smoothstep(0.5, 1.0, luma);
    color = color - mask_h * uHighlights * (color - 1.0);

    // Shadows: 1 - smoothstep(0.0, 0.5, L)
    // RGB_ut = RGB + mask_s * Shadow * (1.0 - RGB)
    // If Shadow +1 (Lift): Brightens. 
    float mask_s = 1.0 - smoothstep(0.0, 0.5, luma);
    color = color + mask_s * uShadows * (1.0 - color);
    
    // 4b. Whites / Blacks (Endpoint Push)
    // Whites: RGB + Whites * smoothstep(0.7, 1.0, RGB)
    // Applied per channel
    vec3 wMask = smoothstep(0.7, 1.0, color);
    color = color + uWhites * wMask;
    
    // Blacks: RGB + Blacks * smoothstep(0.0, 0.3, RGB)
    vec3 bMask = smoothstep(0.0, 0.3, color);
    color = color + uBlacks * bMask;
    
    // 4.5. Parametric Tone Curve
    color = applyParametricCurve(color);
    
    // 5. Tone Curve (Point Curve)
    if (uHasCurve == 1) {
        float r = texture2D(uToneCurve, vec2(clamp(color.r, 0.0, 1.0), 0.5)).r;
        float g = texture2D(uToneCurve, vec2(clamp(color.g, 0.0, 1.0), 0.5)).r;
        float b = texture2D(uToneCurve, vec2(clamp(color.b, 0.0, 1.0), 0.5)).r;
        color = vec3(r, g, b);
    }

    // 6. Color Mixer (HSL)
    vec3 hsl = rgb2hsl(color);
    
    float wRed = getChannelWeight(hsl.x, 0.0) + getChannelWeight(hsl.x, 1.0);
    float wOrange = getChannelWeight(hsl.x, 0.0833);
    float wYellow = getChannelWeight(hsl.x, 0.1666);
    float wGreen = getChannelWeight(hsl.x, 0.3333);
    float wAqua = getChannelWeight(hsl.x, 0.5);
    float wBlue = getChannelWeight(hsl.x, 0.6666);
    float wPurple = getChannelWeight(hsl.x, 0.7777);
    float wMagenta = getChannelWeight(hsl.x, 0.8333);
    
    float hShift = 
       uHueShifts[0] * wRed +
       uHueShifts[1] * wOrange +
       uHueShifts[2] * wYellow +
       uHueShifts[3] * wGreen +
       uHueShifts[4] * wAqua +
       uHueShifts[5] * wBlue +
       uHueShifts[6] * wPurple +
       uHueShifts[7] * wMagenta;
       
    float sShift = 
       uSatShifts[0] * wRed +
       uSatShifts[1] * wOrange +
       uSatShifts[2] * wYellow +
       uSatShifts[3] * wGreen +
       uSatShifts[4] * wAqua +
       uSatShifts[5] * wBlue +
       uSatShifts[6] * wPurple +
       uSatShifts[7] * wMagenta;
       
    float lShift = 
       uLumShifts[0] * wRed +
       uLumShifts[1] * wOrange +
       uLumShifts[2] * wYellow +
       uLumShifts[3] * wGreen +
       uLumShifts[4] * wAqua +
       uLumShifts[5] * wBlue +
       uLumShifts[6] * wPurple +
       uLumShifts[7] * wMagenta;

    hsl.x += hShift; 
    hsl.y += sShift;
    hsl.z += lShift;
    hsl.y = clamp(hsl.y, 0.0, 1.0);
    hsl.z = clamp(hsl.z, 0.0, 1.0);
    color = hsl2rgb(hsl);

    // 7. Vibrance (Selective Saturation)
    // Formula: SatBoost = (1 - max(R, G, B)) * Vibrance
    // RGB = mix(L, RGB, 1 + SatBoost)
    float mx = max(color.r, max(color.g, color.b));
    float satBoost = (1.0 - mx) * uVibrance;
    
    float luma2 = dot(color, Luma);
    vec3 grey = vec3(luma2);
    
    color = mix(grey, color, 1.0 + satBoost);

    // 8. Global + Local Saturation
    color = mix(grey, color, 1.0 + finalSaturation);

    // 9. Detail (Sharpen & Noise)
    if (uSharpenAmount > 0.0 || uNoiseReduction > 0.0) {
       vec2 step = 1.0 / uResolution;
       
       // Neighbor sampling for detail
       vec3 n1 = texture2D(uImage, vTexCoord + vec2(0.0, -step.y)).rgb;
       vec3 n2 = texture2D(uImage, vTexCoord + vec2(-step.x, 0.0)).rgb;
       vec3 n3 = texture2D(uImage, vTexCoord + vec2(step.x, 0.0)).rgb;
       vec3 n4 = texture2D(uImage, vTexCoord + vec2(0.0, step.y)).rgb;
       
       // Approximation: Apply rough Exposure/Contrast to neighbors
       // to match base color logic approx for difference calc.
       float expFactor = pow(2.0, uExposure);
       
       // Helper macro replacement
       vec3 c1 = (n1 * expFactor - 0.18) * (1.0 + uContrast) + 0.18;
       vec3 c2 = (n2 * expFactor - 0.18) * (1.0 + uContrast) + 0.18;
       vec3 c3 = (n3 * expFactor - 0.18) * (1.0 + uContrast) + 0.18;
       vec3 c4 = (n4 * expFactor - 0.18) * (1.0 + uContrast) + 0.18;
       
       vec3 blurred = (c1 + c2 + c3 + c4) * 0.25;
       
       if (uNoiseReduction > 0.0) {
          color = mix(color, blurred, uNoiseReduction * 0.5);
       }
       if (uSharpenAmount > 0.0) {
          vec3 detail = color - blurred;
          color += detail * uSharpenAmount;
       }
    }

    gl_FragColor = vec4(color, texColor.a);
  }
`;
