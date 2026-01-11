export class WebGPUEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.adapter = null;
        this.device = null;
        this.context = null;
        this.pipeline = null;
        this.bindGroup = null;
        this.texture = null;
        this.sampler = null;

        // Uniforms
        // Struct is ~18 floats. 32 is safe margin.
        this.uniformValues = new Float32Array(64); // Increased to 256 bytes for future alignment safety
        this.uniformBuffer = null;
    }

    async init() {
        if (!navigator.gpu) {
            throw new Error("WebGPU not supported");
        }

        this.adapter = await navigator.gpu.requestAdapter();
        if (!this.adapter) {
            throw new Error("No WebGPU adapter found");
        }

        this.device = await this.adapter.requestDevice();
        this.context = this.canvas.getContext('webgpu');

        const format = navigator.gpu.getPreferredCanvasFormat();
        this.context.configure({
            device: this.device,
            format: format,
            alphaMode: 'premultiplied',
        });

        await this.createPipeline(format);
        return true;
    }

    async createPipeline(format) {
        // Import shader code (string)
        // We'll fetch it or import it.
        // For now, placeholder WGSL.
        const shaderCode = `
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

    pad1: f32, // Padding for 16-byte alignment if needed, but f32 stride is 4.
               // Default layout (std140) often requires vec4 alignment.
               // WGSL uniform buffers are strict.
               // f32 is 4 bytes. 
               // 6 + 4 + 3 + 1 = 14 floats. = 56 bytes.
               // Next is Parametric.
    
    // Parametric Curve
    curveHighlights: f32,
    curveLights: f32,
    curveDarks: f32,
    curveShadows: f32,
}

// Basic Math
fn luma(color: vec3f) -> f32 {
    return dot(color, vec3f(0.2126, 0.7152, 0.0722));
}

fn applyParametricCurve(color: vec3f, u: Uniforms) -> vec3f {
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

@group(0) @binding(0) var myTexture: texture_2d<f32>;
@group(0) @binding(1) var mySampler: sampler;
@group(0) @binding(2) var<uniform> u: Uniforms;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
}

@vertex
fn vs(@builtin(vertex_index) vertexIndex : u32) -> VertexOutput {
  var pos = array<vec2f, 6>(
    vec2f(-1.0, -1.0), vec2f( 1.0, -1.0), vec2f(-1.0,  1.0),
    vec2f(-1.0,  1.0), vec2f( 1.0, -1.0), vec2f( 1.0,  1.0)
  );
  
  var output: VertexOutput;
  output.position = vec4f(pos[vertexIndex], 0.0, 1.0);
  output.uv = pos[vertexIndex] * 0.5 + 0.5;
  output.uv.y = 1.0 - output.uv.y; 
  return output;
}

@fragment
fn fs(@location(0) uv: vec2f) -> @location(0) vec4f {
  var color = textureSample(myTexture, mySampler, uv).rgb;
  
  // 1. Exposure
  color = color * pow(2.0, u.exposure);
  
  // 2. Temp/Tint (Approx)
  color.r += u.temp * 0.1;
  color.b -= u.temp * 0.1;
  color.g += u.tint * 0.1;

  // 3. Contrast
  let mid = 0.18;
  color = (color - mid) * (1.0 + u.contrast) + mid;

  // 4. Parametric
  color = applyParametricCurve(color, u);
  
  // 5. Saturation
  let l = luma(color);
  color = mix(vec3f(l), color, 1.0 + u.saturation);

  return vec4f(color, 1.0);
}
    `;

        const shaderModule = this.device.createShaderModule({
            label: 'Fotiq Shader',
            code: shaderCode
        });

        // ... Layout code ...
        // Note: 'auto' layout might infer bindings.
        // Layout
        this.pipeline = this.device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: shaderModule,
                entryPoint: 'vs',
            },
            fragment: {
                module: shaderModule,
                entryPoint: 'fs',
                targets: [{ format }],
            },
            primitive: {
                topology: 'triangle-list',
            },
        });

        // Buffers & Textures placeholder (create later)
        this.uniformBuffer = this.device.createBuffer({
            size: this.uniformValues.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
    }

    loadImage(imageBitmap) {
        // Create Texture from ImageBitmap
        this.texture = this.device.createTexture({
            size: [imageBitmap.width, imageBitmap.height, 1],
            format: 'rgba8unorm', // Input format
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        });

        this.device.queue.copyExternalImageToTexture(
            { source: imageBitmap },
            { texture: this.texture },
            [imageBitmap.width, imageBitmap.height]
        );

        this.sampler = this.device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
        });

        this.updateBindGroup();
        this.render(); // Initial render
    }

    async loadLUT(lutData, size) {
        // Create 3D Texture
        this.lutTexture = this.device.createTexture({
            size: [size, size, size],
            format: 'rgba8unorm',
            dimension: '3d',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });

        this.device.queue.writeTexture(
            { texture: this.lutTexture },
            lutData,
            { bytesPerRow: size * 4, rowsPerImage: size },
            [size, size, size]
        );

        // We need a separate bind group or update the main one.
        // Ideally separate @group(1) for LUTs.
        // For MVP, we pretend it's loaded.
        console.log("LUT Loaded into GPU Memory");
    }

    updateBindGroup() {
        if (!this.pipeline || !this.texture) return;

        this.bindGroup = this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: this.texture.createView() },
                { binding: 1, resource: this.sampler },
                { binding: 2, resource: { buffer: this.uniformBuffer } }
            ]
        });
    }

    updateUniforms(adjustments) {
        if (!this.device) return;

        const u = this.uniformValues;
        // Normalization: Most sliders are -100..100 -> -1.0..1.0
        // Exposure is typically -5..5

        let i = 0;
        u[i++] = adjustments.exposure || 0;
        u[i++] = (adjustments.contrast || 0) / 100.0;
        u[i++] = (adjustments.highlights || 0) / 100.0;
        u[i++] = (adjustments.shadows || 0) / 100.0;
        u[i++] = (adjustments.whites || 0) / 100.0;
        u[i++] = (adjustments.blacks || 0) / 100.0;

        u[i++] = (adjustments.temp || 0) / 100.0;
        u[i++] = (adjustments.tint || 0) / 100.0;
        u[i++] = (adjustments.saturation || 0) / 100.0;
        u[i++] = (adjustments.vibrance || 0) / 100.0;

        u[i++] = 0; // hue
        u[i++] = 0; // sat
        u[i++] = 0; // lum
        u[i++] = 0; // pad

        // Parametric
        u[i++] = (adjustments.curveHighlights || 0) / 100.0;
        u[i++] = (adjustments.curveLights || 0) / 100.0;
        u[i++] = (adjustments.curveDarks || 0) / 100.0;
        u[i++] = (adjustments.curveShadows || 0) / 100.0;

        this.device.queue.writeBuffer(
            this.uniformBuffer,
            0,
            this.uniformValues
        );

        this.render();
    }
    const pass = encoder.beginRenderPass({
        colorAttachments: [{
            view: this.context.getCurrentTexture().createView(),
            loadOp: 'clear',
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
            storeOp: 'store',
        }]
    });

    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.draw(6); // 2 triangles
    pass.end();

    this.device.queue.submit([encoder.finish()]);
}
}
