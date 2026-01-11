/**
 * FOTIQ Plugin SDK v2.0
 * 
 * Plugins must run in a sandboxed environment (e.g. Worker or iframe) in production.
 * This SDK defines the bridge protocol.
 */

export class PluginHost {
    constructor() {
        this.plugins = new Map();
        this.hooks = {
            'processing:before': [],
            'processing:after': [],
            'export:format': []
        };
    }

    register(plugin) {
        if (!plugin.manifest || !plugin.manifest.id) {
            throw new Error("Invalid Plugin Manifest");
        }
        console.log(`Registered Plugin: ${plugin.manifest.name} v${plugin.manifest.version}`);
        this.plugins.set(plugin.manifest.id, plugin);

        if (plugin.onInit) plugin.onInit(this.createAPI(plugin.manifest.id));
    }

    createAPI(pluginId) {
        return {
            log: (msg) => console.log(`[Plugin:${pluginId}] ${msg}`),
            addFilter: (name, shader) => this.registerHook('processing:shader', { name, shader }),
            // Restricted access
        };
    }

    registerHook(hook, data) {
        // ...
    }
}

// Example Plugin Definition
/*
const myPlugin = {
    manifest: { id: 'com.example.sepia', name: 'Sepia Pro', version: '1.0' },
    onInit: (api) => {
        api.log("Ready");
        api.addFilter('Sepia', `vec3 sepia(vec3 c) { ... }`);
    }
};
*/
