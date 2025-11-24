import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { dalGetShippingZones, dalUpdateShippingZone } from '../services/dataAccessLayer';
import { ShippingZone } from '../types';

export const ShippingZones: React.FC = () => {
    const [zones, setZones] = useState<ShippingZone[]>([]);
    const [editingZone, setEditingZone] = useState<Partial<ShippingZone> | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadZones();
    }, []);

    const loadZones = async () => {
        setLoading(true);
        const data = await dalGetShippingZones();
        setZones(data);
        setLoading(false);
    };

    const handleSave = async () => {
        if (!editingZone || !editingZone.name || !editingZone.baseRate) return;
        
        const zoneToSave: ShippingZone = {
            id: editingZone.id || `zone_${Date.now()}`,
            name: editingZone.name,
            regions: editingZone.regions || [],
            baseRate: Number(editingZone.baseRate),
            incrementalRate: Number(editingZone.incrementalRate || 0),
            estimatedDeliveryDays: editingZone.estimatedDeliveryDays || '3-5',
            isActive: editingZone.isActive ?? true
        };

        await dalUpdateShippingZone(zoneToSave);
        setEditingZone(null);
        loadZones();
    };

    return (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-display font-bold text-white">Logistics Network</h2>
                    <p className="text-gray-400">Configure global shipping zones and delivery rates.</p>
                </div>
                <button 
                    onClick={() => setEditingZone({ isActive: true, regions: [] })}
                    className="px-4 py-2 bg-neon-purple text-white font-bold rounded-lg shadow hover:bg-neon-purple/80 transition-all"
                >
                    + Add Zone
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Zone List */}
                <div className="lg:col-span-2 space-y-4">
                    {zones.map(zone => (
                        <GlassCard key={zone.id} className="relative group border-white/10 hover:border-white/30 transition-all">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-bold text-white">{zone.name}</h3>
                                        <span className={`px-2 py-0.5 text-[10px] rounded border ${zone.isActive ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                                            {zone.isActive ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {zone.regions.map((region, i) => (
                                            <span key={i} className="text-xs bg-white/5 px-2 py-1 rounded text-gray-300">
                                                {region}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-mono font-bold text-neon-cyan">{zone.baseRate.toFixed(2)} Pi</div>
                                    <div className="text-[10px] text-gray-500 uppercase">Base Rate</div>
                                </div>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-sm text-gray-400">
                                <div>
                                    <span className="mr-4">Est. Delivery: <span className="text-white">{zone.estimatedDeliveryDays} Days</span></span>
                                    <span>+ {zone.incrementalRate} Pi / kg</span>
                                </div>
                                <button 
                                    onClick={() => setEditingZone(zone)}
                                    className="text-neon-purple hover:text-white font-bold text-xs uppercase"
                                >
                                    Configure
                                </button>
                            </div>
                        </GlassCard>
                    ))}
                    {zones.length === 0 && (
                        <div className="p-10 border border-dashed border-white/10 rounded-xl text-center text-gray-500">
                            No shipping zones configured.
                        </div>
                    )}
                </div>

                {/* Editor / Visualization Sidebar */}
                <div className="space-y-6">
                    {editingZone ? (
                        <GlassCard title={editingZone.id ? "Edit Zone" : "New Shipping Zone"} className="border-neon-purple/50">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Zone Name</label>
                                    <input 
                                        value={editingZone.name || ''}
                                        onChange={e => setEditingZone({...editingZone, name: e.target.value})}
                                        className="w-full bg-black/40 border border-white/10 rounded p-2 text-white outline-none focus:border-neon-purple"
                                        placeholder="e.g. North America"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Regions (Comma separated)</label>
                                    <input 
                                        value={editingZone.regions?.join(', ') || ''}
                                        onChange={e => setEditingZone({...editingZone, regions: e.target.value.split(',').map(s => s.trim())})}
                                        className="w-full bg-black/40 border border-white/10 rounded p-2 text-white outline-none focus:border-neon-purple"
                                        placeholder="USA, Canada, Mexico"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Base Rate (Pi)</label>
                                        <input 
                                            type="number"
                                            value={editingZone.baseRate || ''}
                                            onChange={e => setEditingZone({...editingZone, baseRate: parseFloat(e.target.value)})}
                                            className="w-full bg-black/40 border border-white/10 rounded p-2 text-white outline-none focus:border-neon-purple font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Per Kg (Pi)</label>
                                        <input 
                                            type="number"
                                            value={editingZone.incrementalRate || ''}
                                            onChange={e => setEditingZone({...editingZone, incrementalRate: parseFloat(e.target.value)})}
                                            className="w-full bg-black/40 border border-white/10 rounded p-2 text-white outline-none focus:border-neon-purple font-mono"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Est. Days</label>
                                    <input 
                                        value={editingZone.estimatedDeliveryDays || ''}
                                        onChange={e => setEditingZone({...editingZone, estimatedDeliveryDays: e.target.value})}
                                        className="w-full bg-black/40 border border-white/10 rounded p-2 text-white outline-none focus:border-neon-purple"
                                        placeholder="3-5"
                                    />
                                </div>
                                <div className="flex items-center gap-2 pt-2">
                                    <input 
                                        type="checkbox" 
                                        checked={editingZone.isActive}
                                        onChange={e => setEditingZone({...editingZone, isActive: e.target.checked})}
                                    />
                                    <span className="text-sm text-gray-300">Zone Active</span>
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <button onClick={() => setEditingZone(null)} className="flex-1 py-2 border border-white/20 rounded text-gray-400 hover:text-white">Cancel</button>
                                    <button onClick={handleSave} className="flex-1 py-2 bg-neon-purple text-white rounded font-bold hover:bg-neon-purple/80">Save Zone</button>
                                </div>
                            </div>
                        </GlassCard>
                    ) : (
                        <GlassCard className="bg-gradient-to-br from-blue-900/20 to-black h-64 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <p className="text-gray-400 text-sm">Select a zone to configure coverage or add a new region.</p>
                        </GlassCard>
                    )}
                </div>
            </div>
        </div>
    );
};