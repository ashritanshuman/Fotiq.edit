import { db } from '../db/db';

export const FOTIQ_ENGINE_VERSION = "5.0.0-alpha";

export class ArchivalEngine {
    static async saveEdit(imageId, operations, parentId = null) {
        const id = crypto.randomUUID();

        await db.edits.add({
            id: id,
            image_id: imageId,
            parent_id: parentId, // Provenance
            engine_version: FOTIQ_ENGINE_VERSION, // Pinning
            operations: operations,
            created_at: Date.now()
        });

        await db.audit.add({
            id: crypto.randomUUID(),
            image_id: imageId,
            action: 'SAVE_EDIT',
            timestamp: Date.now()
        });

        return id;
    }

    static async exportSidecar(imageId) {
        const image = await db.images.get(imageId);
        const edits = await db.edits.where('image_id').equals(imageId).toArray();
        const audit = await db.audit.where('image_id').equals(imageId).toArray();

        const sidecar = {
            format: "fotq5",
            version: "1.0",
            original: {
                path: image.path,
                checksum: image.checksum
            },
            edits: edits, // The entire graph
            audit_log: audit
        };

        const blob = new Blob([JSON.stringify(sidecar, null, 2)], { type: 'application/json' });
        // Trigger download or save
        console.log("Sidecar generated", sidecar);
        return blob;
    }
}
