import libraw from 'libraw-wasm';

export const RawLoader = {
    instance: null,

    async init() {
        if (this.instance) return;
        try {
            this.instance = await libraw();
        } catch (e) {
            console.warn("WASM init failed, falling back to basic loader", e);
        }
    },

    async load(file) {
        if (!this.instance) await this.init();

        // Mock/Fallback implementation for prototype stability
        // Real implementation would use:
        // this.instance.FS.writeFile(...)
        // processor.open_file(...)

        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const w = img.width;
                    const h = img.height;
                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    const iData = ctx.getImageData(0, 0, w, h);

                    // Convert to Float32 (Linearize sRGB approx)
                    const floatData = new Float32Array(w * h * 4);
                    for (let i = 0; i < iData.data.length; i++) {
                        floatData[i] = iData.data[i] / 255.0;
                    }

                    resolve({
                        data: floatData,
                        width: w,
                        height: h,
                        metadata: { iso: 100, shutter: '1/125', make: 'Sony', model: 'A7III' }
                    });
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }
};
