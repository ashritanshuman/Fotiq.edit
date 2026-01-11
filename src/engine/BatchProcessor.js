export class BatchProcessor {
    static queue = [];
    static isProcessing = false;

    static async addToQueue(images, preset) {
        this.queue.push(...images.map(img => ({ img, preset })));
        this.processNext();
    }

    static async processNext() {
        if (this.isProcessing || this.queue.length === 0) return;

        this.isProcessing = true;
        const job = this.queue.shift();

        console.log(`Processing Batch Job: ${job.img.name}`);

        try {
            // Simulate processing time
            await new Promise(r => setTimeout(r, 500));

            // In real impl:
            // 1. Load Image to Offscreen Canvas
            // 2. Apply Preset ops
            // 3. engine.render()
            // 4. canvas.convertToBlob()
            // 5. saveAs()

            console.log(`Finished: ${job.img.name}`);
        } catch (e) {
            console.error(e);
        }

        this.isProcessing = false;
        this.processNext();
    }
}
