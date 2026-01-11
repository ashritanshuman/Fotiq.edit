import { VERTEX_SHADER, FRAGMENT_SHADER } from './shaders';

export class WebGLEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });

        if (!this.gl) {
            console.error('WebGL not supported');
            return;
        }

        // Enable Float Textures
        const ext = this.gl.getExtension('OES_texture_float');
        const extLinear = this.gl.getExtension('OES_texture_float_linear');

        if (!ext) {
            console.error('Float textures not supported');
            // Fallback could go here but v2.0 requires float
        }

        this.program = null;
        this.texture = null;
        this.width = 0;
        this.height = 0;

        this.initShaders();
        this.initBuffers();
    }

    initShaders() {
        const gl = this.gl;
        const vertexShader = this.createShader(gl.VERTEX_SHADER, VERTEX_SHADER);
        const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);

        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(this.program));
        }

        gl.useProgram(this.program);

        // Cache uniform locations
        this.uniforms = {
            texture: gl.getUniformLocation(this.program, 'uTexture'),
            curveTexture: gl.getUniformLocation(this.program, 'uCurveTexture'),
            exposure: gl.getUniformLocation(this.program, 'uExposure'),
            contrast: gl.getUniformLocation(this.program, 'uContrast'),
            temperature: gl.getUniformLocation(this.program, 'uTemperature'),
            tint: gl.getUniformLocation(this.program, 'uTint'),
            saturation: gl.getUniformLocation(this.program, 'uSaturation'),
            highlights: gl.getUniformLocation(this.program, 'uHighlights'),
            shadows: gl.getUniformLocation(this.program, 'uShadows'),
            whites: gl.getUniformLocation(this.program, 'uWhites'),
            blacks: gl.getUniformLocation(this.program, 'uBlacks'),

            // Parametric Curve
            curveHighlights: gl.getUniformLocation(this.program, 'uCurveHighlights'),
            curveLights: gl.getUniformLocation(this.program, 'uCurveLights'),
            curveDarks: gl.getUniformLocation(this.program, 'uCurveDarks'),
            curveShadows: gl.getUniformLocation(this.program, 'uCurveShadows'),

            // v4.1 Output Mode
            outputMode: gl.getUniformLocation(this.program, 'uOutputMode'),

            vibrance: gl.getUniformLocation(this.program, 'uVibrance'),
            rotation: gl.getUniformLocation(this.program, 'uRotation'),
            distortion: gl.getUniformLocation(this.program, 'uDistortion'),
            toneCurve: gl.getUniformLocation(this.program, 'uToneCurve'),
            hasCurve: gl.getUniformLocation(this.program, 'uHasCurve'),

            // Mask Counts
            linearCount: gl.getUniformLocation(this.program, 'uLinearCount'),
            radialCount: gl.getUniformLocation(this.program, 'uRadialCount'),
        };

        // Cache Mask Array Uniforms (Linear)
        this.uniforms.linearMasks = [];
        for (let i = 0; i < 3; i++) {
            this.uniforms.linearMasks.push({
                pos: gl.getUniformLocation(this.program, `uLinearMasks[${i}].pos`),
                rot: gl.getUniformLocation(this.program, `uLinearMasks[${i}].rot`),
                feather: gl.getUniformLocation(this.program, `uLinearMasks[${i}].feather`),
                exposure: gl.getUniformLocation(this.program, `uLinearMasks[${i}].exposure`),
                contrast: gl.getUniformLocation(this.program, `uLinearMasks[${i}].contrast`),
                adjustments: gl.getUniformLocation(this.program, `uLinearMasks[${i}].adjustments`),
                invert: gl.getUniformLocation(this.program, `uLinearMasks[${i}].invert`)
            });
        }

        // Cache Mask Array Uniforms (Radial)
        this.uniforms.radialMasks = [];
        for (let i = 0; i < 3; i++) {
            this.uniforms.radialMasks.push({
                center: gl.getUniformLocation(this.program, `uRadialMasks[${i}].center`),
                radii: gl.getUniformLocation(this.program, `uRadialMasks[${i}].radii`),
                rotation: gl.getUniformLocation(this.program, `uRadialMasks[${i}].rotation`),
                feather: gl.getUniformLocation(this.program, `uRadialMasks[${i}].feather`),
                adjustments: gl.getUniformLocation(this.program, `uRadialMasks[${i}].adjustments`),
                invert: gl.getUniformLocation(this.program, `uRadialMasks[${i}].invert`)
            });
        }

        // HSL Arrays
        this.uniforms.hueShifts = gl.getUniformLocation(this.program, 'uHueShifts');
        this.uniforms.satShifts = gl.getUniformLocation(this.program, 'uSatShifts');
        this.uniforms.lumShifts = gl.getUniformLocation(this.program, 'uLumShifts');

        // Detail
        this.uniforms.sharpenAmount = gl.getUniformLocation(this.program, 'uSharpenAmount');
        this.uniforms.noiseLuminance = gl.getUniformLocation(this.program, 'uNoiseReduction');
        this.uniforms.resolution = gl.getUniformLocation(this.program, 'uResolution');
    }

    createShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    initBuffers() {
        const gl = this.gl;

        // Vertex Buffer (Full Quad)
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        const positions = [
            -1.0, 1.0,
            1.0, 1.0,
            -1.0, -1.0,
            1.0, -1.0,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        const positionAttr = gl.getAttribLocation(this.program, 'position');
        gl.enableVertexAttribArray(positionAttr);
        gl.vertexAttribPointer(positionAttr, 2, gl.FLOAT, false, 0, 0);

        // Texture Coordinate Buffer
        // WebGL coords: 0,0 is bottom left. Images are usually top-left.
        // We flip Y here:
        const texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);

        // Standard UVs flipped Y
        const texCoords = [
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,
            1.0, 1.0,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

        const texCoordAttr = gl.getAttribLocation(this.program, 'texCoord');
        gl.enableVertexAttribArray(texCoordAttr);
        gl.vertexAttribPointer(texCoordAttr, 2, gl.FLOAT, false, 0, 0);
    }

    loadImage(img, rawWidth, rawHeight) {
        const gl = this.gl;

        // Create new texture
        if (this.texture) gl.deleteTexture(this.texture);
        this.texture = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        // Upload image
        // Invert Y for WebGL
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        if (img instanceof Float32Array) {
            // Setup for RAW Float data
            // Assumes we passed width/height separately or stored them before calling
            // Actually `loadImage` signature needs update or we assume `img` is the data and we use `this.width`
            // Let's refactor loadImage to accept (data, width, height)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.FLOAT, img);
        } else {
            // Standard Image/Canvas Element
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        }

        // Params
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        if (rawWidth && rawHeight) {
            this.width = rawWidth;
            this.height = rawHeight;
        } else {
            this.width = img.width;
            this.height = img.height;
        }

        // Resize canvas to match image
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        gl.viewport(0, 0, this.width, this.height);
    }

    updateToneCurve(lut) {
        const gl = this.gl;
        if (!this.curveTexture) {
            this.curveTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.curveTexture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        }

        gl.bindTexture(gl.TEXTURE_2D, this.curveTexture);
        // LUT is 256x1 Pixel strip
        // lut is Float32Array(256)
        // We render it as LUMINANCE or ALPHA or RED? 
        // Better: RGBA or LUMINANCE.
        // WebGL 1.0 LUMINANCE with Float might act weird.
        // Let's use simple RGBA or just LUMINANCE if standard.
        // Actually, let's use RGBA to be safe and replicate the value.
        // Or unpack float to RGBA?
        // Let's assume Float texture capability allows LUMINANCE_FLOAT or ALPHA_FLOAT if extension exists?
        // Safest: RGBA FLOAT.

        const data = new Float32Array(256 * 4);
        for (let i = 0; i < 256; i++) {
            const val = lut[i];
            data[i * 4] = val;
            data[i * 4 + 1] = val;
            data[i * 4 + 2] = val;
            data[i * 4 + 3] = 1.0;
        }
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.FLOAT, data);
    }

    render(adjustments, fbo = null, width = null, height = null) {
        this.lastAdjustments = adjustments;
        const gl = this.gl;
        if (!this.texture) return;

        if (fbo) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
            gl.viewport(0, 0, width, height);
        } else {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, this.width, this.height);
        }

        gl.useProgram(this.program);

        // Bind Main Image
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(this.uniforms.image, 0);

        // Bind Curve LUT if exists
        if (this.curveTexture) {
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.curveTexture);
            gl.uniform1i(this.uniforms.toneCurve, 1);
            gl.uniform1i(this.uniforms.hasCurve, 1);
        } else {
            gl.uniform1i(this.uniforms.hasCurve, 0);
        }

        // Uniforms
        // Mask Uniforms
        const linear = (adjustments.masks || []).filter(m => m.type === 'linear').slice(0, 3);
        gl.uniform1i(this.uniforms.linearCount, linear.length);
        linear.forEach((m, i) => {
            const loc = this.uniforms.linearMasks[i];
            if (loc) {
                gl.uniform2f(loc.pos, m.pos?.x || 0.5, m.pos?.y || 0.5);
                gl.uniform1f(loc.rot, m.rot || 0);
                gl.uniform1f(loc.feather, m.feather || 0.1);
                gl.uniform3f(loc.adjustments, (m.exposure || 0) / 100, (m.contrast || 0) / 100, (m.saturation || 0) / 100);
                gl.uniform1f(loc.invert, m.invert ? 1.0 : 0.0);
            }
        });

        const radial = (adjustments.masks || []).filter(m => m.type === 'radial').slice(0, 3);
        gl.uniform1i(this.uniforms.radialCount, radial.length);
        radial.forEach((m, i) => {
            const loc = this.uniforms.radialMasks[i];
            if (loc) {
                gl.uniform2f(loc.center, m.center?.x || 0.5, m.center?.y || 0.5);
                gl.uniform2f(loc.radii, m.radius || 0.3, 0.0);
                gl.uniform1f(loc.rotation, m.rotation || 0);
                gl.uniform1f(loc.feather, m.feather || 0.1);
                gl.uniform3f(loc.adjustments, (m.exposure || 0) / 100, (m.contrast || 0) / 100, (m.saturation || 0) / 100);
                gl.uniform1f(loc.invert, m.invert ? 1.0 : 0.0);
            }
        });
        // Exposure: -5 to +5 range. Slider -100 to 100.
        // v2.0 spec says +/- 5EV.
        // Map slider (e.g. -100..100) to -5..5
        gl.uniform1f(this.uniforms.exposure, (adjustments.exposure || 0) / 20.0);

        // Contrast
        gl.uniform1f(this.uniforms.contrast, (adjustments.contrast || 0) / 100.0);

        // Shadows/Highlights
        // Shadows/Highlights
        gl.uniform1f(this.uniforms.highlights, (adjustments.highlights || 0) / 100.0);
        gl.uniform1f(this.uniforms.shadows, (adjustments.shadows || 0) / 100.0);
        gl.uniform1f(this.uniforms.whites, (adjustments.whites || 0) / 100.0);
        gl.uniform1f(this.uniforms.blacks, (adjustments.blacks || 0) / 100.0);

        // Parametric Curve
        gl.uniform1f(this.uniforms.curveHighlights, (adjustments.curveHighlights || 0) / 100.0);
        gl.uniform1f(this.uniforms.curveLights, (adjustments.curveLights || 0) / 100.0);
        gl.uniform1f(this.uniforms.curveDarks, (adjustments.curveDarks || 0));
        gl.uniform1f(this.uniforms.curveShadows, (adjustments.curveShadows || 0));

        gl.uniform1i(this.uniforms.outputMode, adjustments.outputMode || 0);

        // Temp/Tint
        gl.uniform1f(this.uniforms.temp, (adjustments.temp || 0) / 100.0);
        gl.uniform1f(this.uniforms.tint, (adjustments.tint || 0) / 100.0);

        // Saturation/Vibrance
        gl.uniform1f(this.uniforms.saturation, (adjustments.saturation || 0) / 100.0);
        gl.uniform1f(this.uniforms.vibrance, (adjustments.vibrance || 0) / 100.0);

        // Rotation (Degrees to Radians)
        const rad = (adjustments.rotation || 0) * (Math.PI / 180.0);
        gl.uniform1f(this.uniforms.rotation, rad);

        // Distortion
        // Slider -100 to 100.
        // k value usually small, e.g., -0.5 to 0.5.
        // So divide by 200.0?
        gl.uniform1f(this.uniforms.distortion, (adjustments.distortion || 0) / 200.0);

        // HSL Mixer
        // We need to construct the 8-float arrays from adjustments object
        // Keys: hsl_red_h, hsl_red_s, hsl_red_l, ...
        // Order: Red, Orange, Yellow, Green, Aqua, Blue, Purple, Magenta
        const channels = ['red', 'orange', 'yellow', 'green', 'aqua', 'blue', 'purple', 'magenta'];
        const hArr = new Float32Array(8);
        const sArr = new Float32Array(8);
        const lArr = new Float32Array(8);

        channels.forEach((ch, i) => {
            // Slider -100 to 100
            // Hue Shift: +/- 30 degrees? Approx 0.1/0.2. 
            // Let's make it +/- 0.1 (36 degrees) for safety or more.
            hArr[i] = (adjustments[`hsl_${ch}_h`] || 0) / 1000.0;
            // Sat: +/- 1.0 (Full desat or double sat)
            sArr[i] = (adjustments[`hsl_${ch}_s`] || 0) / 100.0;
            // Lum: +/- 0.5 (Brighten/Darken)
            lArr[i] = (adjustments[`hsl_${ch}_l`] || 0) / 200.0;
        });

        gl.uniform1fv(this.uniforms.hueShifts, hArr);
        gl.uniform1fv(this.uniforms.satShifts, sArr);
        gl.uniform1fv(this.uniforms.lumShifts, lArr);

        // Detail
        // Sharpen 0..150 -> 0..1.5? Or more.
        gl.uniform1f(this.uniforms.sharpenAmount, (adjustments.sharpenAmount || 0) / 100.0);
        // Noise 0..100 -> 0..0.01 (Pixels) ? No, NR strength.
        gl.uniform1f(this.uniforms.noiseLuminance, (adjustments.noiseLuminance || 0) / 100.0);

        // Resolution (texel size)
        gl.uniform2f(this.uniforms.resolution, this.width, this.height);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    getCanvas() {
        return this.canvas;
    }
}
