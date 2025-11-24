
import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { dalGetInventory, dalGetLedger, dalAdjustStock } from '../services/dataAccessLayer';
import { InventoryItem, LedgerEntry } from '../types';

export const InventoryLedger: React.FC = () => {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [ledger, setLedger] = useState<LedgerEntry[]>([]);
    const [viewMode, setViewMode] = useState<'STOCK' | 'HISTORY'>('STOCK');
    const [loading, setLoading] = useState(true);

    // Adjustment Modal State
    const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
    const [adjustQty, setAdjustQty] = useState('');
    const [adjustReason, setAdjustReason] = useState('');

    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = async () => {
        setLoading(true);
        const [invData, ledgerData] = await Promise.all([
            dalGetInventory(),
            dalGetLedger()
        ]);
        // Phase 5.5: Sort by Eco-Rank (Default sorting)
        const sortedInv = invData.sort((a, b) => (b.ecoRank || 0) - (a.ecoRank || 0));
        setInventory(sortedInv);
        setLedger(ledgerData);
        setLoading(false);
    };

    const handleAdjustment = async () => {
        if (!adjustingItem || !adjustQty || !adjustReason) return;
        const qty = parseInt(adjustQty);
        if (isNaN(qty) || qty === 0) return;

        const success = await dalAdjustStock(adjustingItem.id, qty, adjustReason);
        if (success) {
            setAdjustingItem(null);
            setAdjustQty('');
            setAdjustReason('');
            refreshData();
        } else {
            alert("Adjustment Failed. Check stock levels.");
        }
    };

    const totalValue = inventory.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const lowStockItems = inventory.filter(i => i.quantity <= i.lowStockThreshold).length;

    return (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-display font-bold text-white">Inventory Ledger</h2>
                    <p className="text-gray-400">Track physical assets, materials, and merchandise.</p>
                </div>
                <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                    <button 
                        onClick={() => setViewMode('STOCK')}
                        className={`px-4 py-2 rounded text-sm font-bold transition-all ${viewMode === 'STOCK' ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-gray-400 hover:text-white'}`}
                    >
                        Current Stock
                    </button>
                    <button 
                        onClick={() => setViewMode('HISTORY')}
                        className={`px-4 py-2 rounded text-sm font-bold transition-all ${viewMode === 'HISTORY' ? 'bg-neon-purple/20 text-neon-purple' : 'text-gray-400 hover:text-white'}`}
                    >
                        Ledger History
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="border-neon-cyan/30">
                    <div className="text-xs text-gray-400 uppercase">Total Asset Value</div>
                    <div className="text-2xl font-mono font-bold text-white">{totalValue.toFixed(2)} Pi</div>
                </GlassCard>
                <GlassCard className={`${lowStockItems > 0 ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'}`}>
                    <div className="text-xs text-gray-400 uppercase">Low Stock Alerts</div>
                    <div className={`text-2xl font-mono font-bold ${lowStockItems > 0 ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
                        {lowStockItems} Items
                    </div>
                </GlassCard>
                <GlassCard className="border-white/10">
                    <div className="text-xs text-gray-400 uppercase">Total SKU Count</div>
                    <div className="text-2xl font-mono font-bold text-white">{inventory.length}</div>
                </GlassCard>
            </div>

            {/* Main Content */}
            {viewMode === 'STOCK' ? (
                <GlassCard className="overflow-hidden !p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-400 uppercase bg-white/5 font-mono">
                                <tr>
                                    <th className="px-6 py-4">SKU / Name</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Eco-Rank</th>
                                    <th className="px-6 py-4 text-right">Qty</th>
                                    <th className="px-6 py-4 text-right">Unit Price</th>
                                    <th className="px-6 py-4">Location</th>
                                    <th className="px-6 py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {inventory.map(item => {
                                    // Determine rank color
                                    const rankColor = (item.ecoRank || 0) >= 8 ? 'text-green-400' : (item.ecoRank || 0) >= 5 ? 'text-yellow-400' : 'text-gray-500';
                                    
                                    return (
                                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-white">{item.name}</div>
                                            <div className="text-xs text-gray-500">{item.sku}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded border border-white/10 text-[10px] bg-black/20">
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1">
                                                <span className={`font-bold ${rankColor}`}>{item.ecoRank || 0}</span>
                                                <span className="text-[8px] text-gray-600 uppercase">/ 10</span>
                                            </div>
                                            {item.sustainabilityTags && item.sustainabilityTags.length > 0 && (
                                                <div className="flex gap-1 mt-1">
                                                    {item.sustainabilityTags.slice(0,2).map(t => (
                                                        <span key={t} className="text-[8px] bg-green-900/30 text-green-300 px-1 rounded">{t}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className={`px-6 py-4 text-right font-mono font-bold ${item.quantity <= item.lowStockThreshold ? 'text-red-400' : 'text-green-400'}`}>
                                            {item.quantity}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-gray-300">
                                            {item.unitPrice.toFixed(2)} Pi
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">
                                            {item.location}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => setAdjustingItem(item)}
                                                className="text-neon-cyan hover:underline text-xs"
                                            >
                                                Adjust
                                            </button>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            ) : (
                <GlassCard className="overflow-hidden !p-0">
                    <div className="overflow-x-auto">
                         <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-400 uppercase bg-white/5 font-mono">
                                <tr>
                                    <th className="px-6 py-4">Timestamp</th>
                                    <th className="px-6 py-4">Item</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4 text-right">Delta</th>
                                    <th className="px-6 py-4">Reason</th>
                                    <th className="px-6 py-4">User</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {ledger.map(entry => (
                                    <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 text-gray-400 font-mono text-xs">
                                            {new Date(entry.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-white">
                                            {entry.itemName}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                                entry.type === 'INBOUND' ? 'bg-green-500/20 text-green-400' : 
                                                entry.type === 'OUTBOUND' ? 'bg-red-500/20 text-red-400' : 
                                                'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                                {entry.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono">
                                            {entry.type === 'OUTBOUND' ? '-' : '+'}{entry.quantity}
                                        </td>
                                        <td className="px-6 py-4 text-gray-300 italic">
                                            {entry.reason}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs uppercase">
                                            {entry.performedBy}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            )}

            {/* Adjustment Modal */}
            {adjustingItem && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <GlassCard className="max-w-md w-full border-neon-cyan/50">
                        <h3 className="text-xl font-bold text-white mb-4">Adjust Stock: {adjustingItem.name}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Quantity Adjustment (+/-)</label>
                                <input 
                                    type="number" 
                                    value={adjustQty}
                                    onChange={(e) => setAdjustQty(e.target.value)}
                                    placeholder="-5 or 10"
                                    className="w-full bg-black/40 border border-white/10 rounded p-3 text-white focus:border-neon-cyan outline-none"
                                />
                                <p className="text-[10px] text-gray-500 mt-1">Current Stock: {adjustingItem.quantity}</p>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Reason code</label>
                                <select 
                                    value={adjustReason} 
                                    onChange={(e) => setAdjustReason(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded p-3 text-white focus:border-neon-cyan outline-none"
                                >
                                    <option value="">Select Reason...</option>
                                    <option value="Restock Shipment">Restock Shipment</option>
                                    <option value="Customer Order">Customer Order</option>
                                    <option value="Damaged/Lost">Damaged / Lost</option>
                                    <option value="Audit Correction">Audit Correction</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button 
                                    onClick={() => setAdjustingItem(null)}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded text-gray-300 font-bold"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleAdjustment}
                                    className="flex-1 py-3 bg-neon-cyan/20 hover:bg-neon-cyan/30 text-neon-cyan border border-neon-cyan/50 rounded font-bold"
                                >
                                    Confirm Update
                                </button>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};
