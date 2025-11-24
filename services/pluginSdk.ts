
import { Plugin, PluginManifest } from "../types";

// ARCHITEX PLUGIN SDK
// Provides a sandboxed environment for third-party extensions to interact with the Core OS.

interface PluginContext {
    api: {
        notify: (message: string, type?: 'info' | 'success' | 'error') => void;
        navigate: (view: string) => void;
        getData: (scope: string) => Promise<any>;
    };
    metadata: PluginManifest;
}

class PluginSDK {
    private activePlugins: Map<string, any> = new Map();

    /**
     * Simulates loading a third-party script from a URL.
     * In a real app, this would use an iframe sandbox or a secure runtime like QuickJS.
     */
    async loadPlugin(plugin: Plugin): Promise<void> {
        console.log(`[PluginSDK] Loading extension: ${plugin.name} (${plugin.id})...`);
        
        // Simulate loading delay
        await new Promise(r => setTimeout(r, 500));

        // Create Sandboxed Context
        const context: PluginContext = {
            api: {
                notify: (msg, type) => console.log(`[Plugin: ${plugin.name}] Notification: ${msg}`),
                navigate: (view) => console.log(`[Plugin: ${plugin.name}] Nav request to: ${view}`),
                getData: async (scope) => {
                    // Mock data access based on permissions
                    if (plugin.permissions.includes('READ_STOCK') && scope === 'INVENTORY') {
                        return [{ sku: 'MOCK-ITEM', qty: 100 }];
                    }
                    return null;
                }
            },
            metadata: plugin
        };

        // Register "Active" instance (mock)
        this.activePlugins.set(plugin.id, {
            context,
            status: 'RUNNING',
            startTime: Date.now()
        });

        console.log(`[PluginSDK] ${plugin.name} initialized successfully.`);
    }

    async unloadPlugin(pluginId: string): Promise<void> {
        if (this.activePlugins.has(pluginId)) {
            console.log(`[PluginSDK] Unloading ${pluginId}...`);
            this.activePlugins.delete(pluginId);
        }
    }

    /**
     * Validates a manifest uploaded by a developer.
     */
    validateManifest(json: string): PluginManifest {
        try {
            const parsed = JSON.parse(json);
            if (!parsed.id || !parsed.name || !parsed.version) {
                throw new Error("Missing required fields (id, name, version)");
            }
            return parsed as PluginManifest;
        } catch (e) {
            throw new Error("Invalid JSON Manifest");
        }
    }
}

export const pluginSdk = new PluginSDK();
