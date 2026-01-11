/**
 * FOTIQ Color Science v4.1
 * Precision Math for RGB -> CMYK Pipeline
 * 
 * Constants based on D65 Standard Observer 2deg.
 */

export const IlluminantD65 = [95.047, 100.000, 108.883];

// sRGB (Linear) to XYZ Matrix
// [X]   [0.4124 0.3576 0.1805] [R]
// [Y] = [0.2126 0.7152 0.0722] [G]
// [Z]   [0.0193 0.1192 0.9505] [B]
const M_RGB_XYZ = [
    0.4124, 0.3576, 0.1805,
    0.2126, 0.7152, 0.0722,
    0.0193, 0.1192, 0.9505
];

export function rgbToXyz(r, g, b) {
    // Input linear RGB [0..1]
    const x = (r * M_RGB_XYZ[0]) + (g * M_RGB_XYZ[1]) + (b * M_RGB_XYZ[2]);
    const y = (r * M_RGB_XYZ[3]) + (g * M_RGB_XYZ[4]) + (b * M_RGB_XYZ[5]);
    const z = (r * M_RGB_XYZ[6]) + (g * M_RGB_XYZ[7]) + (b * M_RGB_XYZ[8]);
    return [x * 100, y * 100, z * 100]; // Scale to D65 range
}

const EPSILON = 0.008856; // (6/29)^3
const KAPPA = 903.3; // (29/3)^3

function f(t) {
    return t > EPSILON ? Math.cbrt(t) : (KAPPA * t + 16) / 116;
}

export function xyzToLab(x, y, z) {
    const Xn = IlluminantD65[0];
    const Yn = IlluminantD65[1];
    const Zn = IlluminantD65[2];

    const fx = f(x / Xn);
    const fy = f(y / Yn);
    const fz = f(z / Zn);

    const L = 116 * fy - 16;
    const a = 500 * (fx - fy);
    const b = 200 * (fy - fz);

    return [L, a, b];
}

// GCR / UCR Implementation
// Input: Preliminary CMY (0..1)
// Function K = g * min(C,M,Y)
export function applyGCR(c, m, y, g = 0.5) {
    const k = g * Math.min(c, m, y);
    return [c - k, m - k, y - k, k];
}

// Total Ink Limit
// Scale CMY if sum > Limit (e.g. 300%)
export function applyTIL(c, m, y, k, limit = 3.0) {
    const total = c + m + y + k;
    if (total > limit) {
        // Simple strategy: Descale CMY to fit
        // Requirement says "Never scale K"
        const currentCMY = c + m + y;
        const targetCMY = limit - k; // Remaining budget

        if (targetCMY < 0) {
            // K alone exceeds limit? Should verify k <= limit first.
            // But assuming we can't touch K, we clamp CMY to 0?
            return [0, 0, 0, k];
        }

        const scale = targetCMY / currentCMY;
        return [c * scale, m * scale, y * scale, k];
    }
    return [c, m, y, k];
}

// Mock ICC Transformation (Lab -> CMYK)
// In production, this samples a 3D CLUT.
// Here we implement a generic approximation for SWOP validation.
export function labToCmyk_Mock(L, a, b) {
    // Very rough conversion for testing pipeline flow
    // 1. Lab -> RGB
    // 2. RGB -> CMY (Complement)
    // 3. CMY -> CMYK

    // (Omitted detailed analytical inverse for brevity, using simple placeholder)
    // Real v4.1 relies on LUT.
    const y = (L + 16) / 116;
    // ...
    // Placeholder: Linear inversion
    const r = L / 100;
    const g = L / 100;
    const bl = L / 100;

    return [1 - r, 1 - g, 1 - bl]; // CMY
}
