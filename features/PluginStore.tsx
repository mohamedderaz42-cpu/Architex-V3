
import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { dalGetPluginStore, dalInstallPlugin, dalUninstallPlugin, dalPublishPlugin } from '../services/dataAccessLayer';
import { piService } from '../services/piService';
import { pluginSdk } from '../services/pluginSdk';
import { Plugin } from '../types';

export const PluginStore: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'MARKET' | 'INSTALLED' | 'DEVELOPER'>('MARKET');
    const [plugins, setPlugins] = useState<Plugin[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Dev Console State
    const [manifestJson, setManifestJson] = useState('');

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        const data = await dalGetPluginStore();
        
        if (activeTab === 'INSTALLED') {
            setPlugins(data.filter(p => p.status === 'INSTALLED'));
        } else {
            setPlugins(data);
        }
        setLoading(false);
    };

    const handleInstall = async (plugin: Plugin) => {
        setProcessingId(plugin.id);
        
        // Payment Logic if price > 0
        if (plugin.price > 0) {
            try {
                await piService.createTreasuryPayment(
                    `Plugin: ${plugin.name}`,
                    plugin.price,
                    {
                        onReadyForServerApproval: async (pid) => console.log("Payment pending...", pid),
                        onReadyForServerCompletion: async (pid, tx) => {
                            await finalizeInstall(plugin.id);
                        },
                        onCancel: () => setProcessingId(null),
                        onError: () => { alert("Payment Failed"); setProcessingId(null); }
                    }
                );
            } catch (e) {
                setProcessingId(null);
            }
        } else {
            await finalizeInstall(plugin.id);
        }
    };

    const finalizeInstall = async (id: string) => {
        const success = await dalInstallPlugin(id);
        if (success) {
            alert("Extension Installed Successfully!");
            loadData();
        }
        setProcessingId(null);
    };

    const handleUninstall = async (id: string) => {
        if (!confirm("Remove this extension?")) return;
        setProcessingId(id);
        await dalUninstallPlugin(id);
        loadData();
        setProcessingId(null);
    };

    const handlePublish = async () => {
        try {
            const manifest = pluginSdk.validateManifest(manifestJson);
            await dalPublishPlugin(manifest);
            alert("Plugin submitted for review!");
            setManifestJson('');
        } catch (e: any) {
            alert(`Error: ${e.message}`);
        }
    };

    return (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-display font-bold text-white">App Store</h2>
                    <p className="text-gray-400">Expand Architex OS with third-party extensions.</p>
                </div>
                <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                    <button 
                        onClick={() => setActiveTab('MARKET')}
                        className={`px-4 py-2 rounded text-sm font-bold transition-all ${activeTab === 'MARKET' ? 'bg-neon-purple/20 text-neon-purple' : 'text-gray-400 hover:text-white'}`}
                    >
                        Browse
                    </button>
                    <button 
                        onClick={() => setActiveTab('INSTALLED')}
                        className={`px-4 py-2 rounded text-sm font-bold transition-all ${activeTab === 'INSTALLED' ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-gray-400 hover:text-white'}`}
                    >
                        Installed
                    </button>
                    <button 
                        onClick={() => setActiveTab('DEVELOPER')}
                        className={`px-4 py-2 rounded text-sm font-bold transition-all ${activeTab === 'DEVELOPER' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Developer
                    </button>
                </div>
            </div>

            {activeTab === 'MARKET' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plugins.map(plugin => (
                        <GlassCard key={plugin.id} className="group relative flex flex-col h-full transition-all hover:border-neon-purple/30">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-2xl shadow-inner">
                                    {plugin.iconUrl}
                                </div>
                                <div className="text-right">
                                    <div className={`font-mono font-bold ${plugin.price > 0 ? 'text-neon-cyan' : 'text-green-400'}`}>
                                        {plugin.price > 0 ? `${plugin.price} Pi` : 'FREE'}
                                    </div>
                                    <div className="text-[10px] text-gray-500 uppercase">{plugin.status}</div>
                                </div>
                            </div>
                            
                            <h3 className="font-bold text-white text-lg mb-1">{plugin.name}</h3>
                            <p className="text-xs text-gray-500 mb-3">by {plugin.developer}</p>
                            <p className="text-sm text-gray-300 mb-4 flex-1">{plugin.description}</p>
                            
                            <div className="flex gap-2 mt-auto pt-4 border-t border-white/5">
                                <div className="text-[10px] text-gray-500 flex items-center gap-1">
                                    <span>★ {plugin.rating}</span>
                                    <span>• {plugin.downloads} DLs</span>
                                </div>
                                <div className="flex-1 text-right">
                                    {plugin.status === 'INSTALLED' ? (
                                        <button disabled className="px-4 py-2 bg-white/5 rounded text-xs font-bold text-gray-500 cursor-not-allowed">
                                            Installed
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => handleInstall(plugin)}
                                            disabled={!!processingId}
                                            className="px-4 py-2 bg-neon-purple text-white rounded text-xs font-bold hover:bg-neon-purple/80 transition-all disabled:opacity-50"
                                        >
                                            {processingId === plugin.id ? 'Installing...' : 'Install'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}

            {activeTab === 'INSTALLED' && (
                <div className="space-y-4">
                    {plugins.length === 0 ? (
                        <div className="p-10 border border-dashed border-white/10 rounded-xl text-center text-gray-500">
                            No extensions installed.
                        </div>
                    ) : (
                        plugins.map(plugin => (
                            <GlassCard key={plugin.id} className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="text-2xl">{plugin.iconUrl}</div>
                                    <div>
                                        <h3 className="font-bold text-white">{plugin.name} <span className="text-xs text-gray-500">v{plugin.version}</span></h3>
                                        <div className="flex gap-2 mt-1">
                                            {plugin.permissions.map(perm => (
                                                <span key={perm} className="text-[8px] bg-white/10 px-2 py-0.5 rounded text-gray-300">{perm}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button className="px-4 py-2 bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 rounded text-xs font-bold hover:bg-neon-cyan/20">
                                        Settings
                                    </button>
                                    <button 
                                        onClick={() => handleUninstall(plugin.id)}
                                        disabled={!!processingId}
                                        className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded text-xs font-bold hover:bg-red-500/20"
                                    >
                                        {processingId === plugin.id ? '...' : 'Uninstall'}
                                    </button>
                                </div>
                            </GlassCard>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'DEVELOPER' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <GlassCard title="Publish Extension">
                        <p className="text-sm text-gray-400 mb-4">Upload your `architex.json` manifest to submit a plugin to the global store.</p>
                        <textarea 
                            value={manifestJson}
                            onChange={e => setManifestJson(e.target.value)}
                            className="w-full h-64 bg-black/40 border border-white/10 rounded p-4 font-mono text-xs text-white focus:border-neon-purple outline-none mb-4"
                            placeholder={`{
  "id": "plg_my_tool",
  "name": "My Amazing Tool",
  "version": "1.0.0",
  ...
}`}
                        />
                        <button 
                            onClick={handlePublish}
                            disabled={!manifestJson}
                            className="w-full py-3 bg-white/10 border border-white/20 text-white font-bold rounded hover:bg-white/20 disabled:opacity-50"
                        >
                            Submit Manifest
                        </button>
                    </GlassCard>
                    
                    <GlassCard title="Documentation">
                        <ul className="space-y-2 text-sm text-gray-300 list-disc pl-4">
                            <li>Use the <strong>Architex SDK</strong> to interact with the OS.</li>
                            <li>Scripts are sandboxed. Network access requires `NETWORK_ACCESS` permission.</li>
                            <li>Revenue (70%) is paid out to your wallet in real-time.</li>
                            <li>Review process takes 24-48 hours.</li>
                        </ul>
                        <div className="mt-6 p-4 bg-black/30 rounded border border-white/5">
                            <div className="text-xs font-bold text-gray-500 uppercase mb-2">Example API Call</div>
                            <code className="text-xs text-neon-cyan font-mono">
                                window.architex.api.notify("Hello World");
                            </code>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};
