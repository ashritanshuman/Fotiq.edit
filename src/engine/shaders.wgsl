
// Basic Math Helpers
fn luma(color: vec3f) -> f32 {
    return dot(color, vec3f(0.2126, 0.7152, 0.0722));
}

fn sat(x: f32) -> f32 {
    return clamp(x, 0.0, 1.0);
}

// Structs
struct Uniforms {
    exposure: f32,
    contrast: f32,
    highlights: f32,
    shadows: f32,
    whites: f32,
    blacks: f32,
    
    // Color
    temp: f32,
    tint: f32,
    saturation: f32,
    vibrance: f32,
    
    // HSL Master
    hueGlobal: f32,
    satGlobal: f32,
    lumGlobal: f32,
    
    // Parametric Curve
    curveHighlights: f32,
    curveLights: f32,
    curveDarks: f32,
    curveShadows: f32,
    
    // Detail
    sharpen: f32,
    clarity: f32, // Unused/Simplistic
    zoom: f32,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
}

@group(0) @binding(0) var sourceTexture: texture_2d<f32>;
@group(0) @binding(1) var sourceSampler: sampler;
@group(0) @binding(2) var<uniform> u: Uniforms;
// @binding(3) could be ToneCurve LUT

// --- FUNCTIONS ---

// Temperature/Tint
// Simplistic adaption from GLSL
fn adjustTemperature(color: vec3f, temp: f32, tint: f32) -> vec3f {
    var out = color;
    // Temp: Increase R, decrease B
    out.r += temp * 0.1;
    out.b -= temp * 0.1;
    // Tint: Green/Magenta
    out.g += tint * 0.1;
    return out;
}

fn applyParametricCurve(color: vec3f) -> vec3f {
    let L = luma(color);
    if (L <= 0.001) { return color; }

    let m_shadows = smoothstep(0.0, 0.25, L) * (1.0 - smoothstep(0.25, 0.5, L));
    let m_darks = smoothstep(0.25, 0.5, L) * (1.0 - smoothstep(0.5, 0.75, L));
    let m_lights = smoothstep(0.5, 0.75, L) * (1.0 - smoothstep(0.75, 1.0, L));
    let m_highlights = smoothstep(0.75, 1.0, L);

    let diff = 
        u.curveShadows * m_shadows * (0.18 - L) +
        u.curveDarks * m_darks * (0.18 - L) +
        u.curveLights * m_lights * (1.0 - L) +
        u.curveHighlights * m_highlights * (1.0 - L);

    let L_new = L + diff;
    return color * (L_new / max(L, 0.0001));
}

// Main Fragment
@fragment
fn fs(@location(0) uv: vec2f) -> @location(0) vec4f {
    var color = textureSample(sourceTexture, sourceSampler, uv).rgb;
    
    // 1. White Balance
    color = adjustTemperature(color, u.temp, u.tint);
    
    // 2. Exposure
    color = color * pow(2.0, u.exposure);
    
    // 3. Contrast
    let mid = 0.18; // Linear Middle Gray
    // Simple pivot
    color = (color - mid) * (1.0 + u.contrast) + mid;
    color = max(vec3f(0.0), color); // clamp low
    
    // 4. Tone Map (Highlight/Shadows - Global)
    // Basic implementation
    // if u.highlights < 0 -> compress highlights
    // This part is complex to port exactly without full log tones.
    // We'll stick to Parametric Curve for major toning.
    
    // 4.5. Parametric Curve
    color = applyParametricCurve(color);
    
    // 5. Saturation
    let l = luma(color);
    color = mix(vec3f(l), color, 1.0 + u.saturation);
    
    return vec4f(color, 1.0);
}

// Vertex Shader
@vertex
fn vs(@builtin(vertex_index) vertexIndex : u32) -> VertexOutput {
  var pos = array<vec2f, 6>(
    vec2f(-1.0, -1.0), vec2f( 1.0, -1.0), vec2f(-1.0,  1.0),
    vec2f(-1.0,  1.0), vec2f( 1.0, -1.0), vec2f( 1.0,  1.0)
  );
  
  var output: VertexOutput;
  output.position = vec4f(pos[vertexIndex], 0.0, 1.0);
  output.uv = pos[vertexIndex] * 0.5 + 0.5;
  output.uv.y = 1.0 - output.uv.y; // Flip Y
  return output;
}
