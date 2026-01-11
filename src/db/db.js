import Dexie from 'dexie';

// FOTIQ v5.0 Database Schema
export const db = new Dexie('FotiqCatalogV5');

db.version(1).stores({
    images: 'id, path, checksum, width, height, bit_depth, color_space, dateAdded',
    edits: 'id, image_id, parent_id, engine_version, created_at', // Graph: parent_id
    versions: 'id, image_id, name',
    metadata: 'image_id',
    collections: 'id, name',
    audit: 'id, image_id, action, timestamp' // v5.0 Audit Log
});


// Helper to add image (v4.1 style)
// Helper to add image (v4.1 style)
export async function addImageToCatalog(entry) {
    let file;
    let fileHandle = null;

    if (entry.getFile) {
        // It's a FileSystemFileHandle
        file = await entry.getFile();
        fileHandle = entry;
    } else if (entry instanceof File) {
        // It's a standard File object (fallback)
        file = entry;
        fileHandle = entry; // Store File object directly if no handle
    } else {
        console.error("Unknown entry type", entry);
        return;
    }

    const id = crypto.randomUUID();

    // 1. Basic Metadata (Placeholder for full parse)
    const imgData = {
        id: id,
        path: file.name, // Handle relative/virtual
        checksum: 'sha256-placeholder',
        width: 0,
        height: 0,
        bit_depth: 8,
        color_space: 'sRGB',
        dateAdded: Date.now(),
        fileHandle: fileHandle // Non-standard Dexie storage, strictly local
    };

    await db.images.add(imgData);

    // 2. Extract Metadata (Placeholder)
    await db.metadata.add({
        image_id: id,
        exif: {},
        iptc: {},
        xmp: {}
    });

    return id;
}
