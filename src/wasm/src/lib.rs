use wasm_bindgen::prelude::*;

// C. Core Data Structure
// --- FOTIQ v4.1 Computational Engine ---

#[wasm_bindgen]
pub struct HDRMerger {
    // Store exposures maybe?
}

// Debevec Weighting Function
// w(z) = z if z <= 0.5 else 1-z
// Optimized: 0.5 - abs(z - 0.5)
#[wasm_bindgen]
pub fn compute_weight(pixel_value: f32) -> f32 {
    let z = pixel_value.clamp(0.0, 1.0);
    if z <= 0.5 {
        z
    } else {
        1.0 - z
    }
}

// Panorama Projection Math
#[wasm_bindgen]
pub enum ProjectionType {
    Rectilinear,
    Cylindrical,
    Spherical
}

#[wasm_bindgen]
pub fn project_pixel(x: f32, y: f32, z: f32, f: f32, p_type: ProjectionType) -> Vec<f32> {
    match p_type {
        ProjectionType::Rectilinear => {
            // x = f * X/Z
            vec![f * x / z, f * y / z]
        },
        ProjectionType::Cylindrical => {
            // x = f * atan(X/Z)
            // y = f * Y / sqrt(X^2 + Z^2)
            let hypot = (x*x + z*z).sqrt();
            vec![f * (x/z).atan(), f * y / hypot]
        },
        ProjectionType::Spherical => {
            // x = f * atan(X/Z)
            // y = f * atan(Y / sqrt...)
            let hypot = (x*x + z*z).sqrt();
            vec![f * (x/z).atan(), f * (y/hypot).atan()]
        }
    }
}

// Homography Solver Stub
// Real least-squares implementation requires Matrix libraries (nalgebra).
// For v4.1 demo, we provide the interface.
#[wasm_bindgen]
pub fn solve_homography_stub(points: &[f32]) -> Vec<f32> {
    // Returns Identity 3x3
    vec![
        1.0, 0.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 0.0, 1.0
    ]
}

#[wasm_bindgen]
pub struct ImageBuffer {
    pub width: u32,
    pub height: u32,
    pixels: Vec<u8>, // RGBA linear float
}

#[wasm_bindgen]
impl ImageBuffer {
    pub fn new(width: u32, height: u32) -> ImageBuffer {
        let size = (width * height * 4) as usize;
        ImageBuffer {
            width,
            height,
            pixels: vec![0; size],
        }
    }

    pub fn get_pixels_ptr(&self) -> *const u8 {
        self.pixels.as_ptr()
    }
}

// D. Operation Trait
pub trait Operation {
    fn apply(&self, buffer: &mut ImageBuffer);
}

// E. Example: Exposure Operation
pub struct Exposure {
    pub ev: f32,
}

impl Operation for Exposure {
    fn apply(&self, img: &mut ImageBuffer) {
        let factor = 2.0_f32.powf(self.ev);
        for px in img.pixels.iter_mut() {
            // Apply to R, G, B only? Or all? 
            // Usually Alpha is untouched.
            // But simple iter assumes all.
            // Let's implement robust version.
        }
        // Correct chunk iteration
        for chunk in img.pixels.chunks_mut(4) {
            chunk[0] *= factor;
            chunk[1] *= factor;
            chunk[2] *= factor;
            // chunk[3] (Alpha) unchanged
        }
    }
}

// F. Tone Curve Operation
pub struct ToneCurve {
    pub lut: Vec<f32>, // 4096 entry LUT
}

impl Operation for ToneCurve {
    fn apply(&self, img: &mut ImageBuffer) {
        let lut_len = self.lut.len() as f32;
        let max_idx = lut_len - 1.0;

        for chunk in img.pixels.chunks_mut(4) {
             for c in 0..3 {
                 let val = chunk[c];
                 let clamped = val.max(0.0).min(1.0);
                 let idx_f = clamped * max_idx;
                 let idx = idx_f as usize;
                 
                 // Linear Interpolation
                 let fract = idx_f - (idx as f32);
                 let v1 = self.lut[idx];
                 // Boundary check
                 let v2 = if idx + 1 < self.lut.len() { self.lut[idx+1] } else { v1 };
                 
                 chunk[c] = v1 * (1.0 - fract) + v2 * fract;
             }
        }
    }
}

// G. WASM Export / Pipeline Entry
#[wasm_bindgen]
pub fn process_image(img: &mut ImageBuffer, operations_json: &str) {
    // Parse JSON ops (Mock)
    // In real impl, use serde_json to deserialize list of structs
    // Apply them sequentially.
    // Reference implementation logic.
}
