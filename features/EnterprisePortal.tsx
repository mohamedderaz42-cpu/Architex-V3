
import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { dalGetEnterpriseProfile, dalAddEnterpriseUser, dalSubmitBulkOrder, dalGetClientOrders } from '../services/dataAccessLayer';
import { adminBotService } from '../services/adminBotService';
import { EnterpriseProfile, EnterpriseMember, Order } from '../types';

export const EnterprisePortal: React.FC = () => {
    const [profile, setProfile] = useState<EnterpriseProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'TEAM' | 'PROCUREMENT'>('DASHBOARD');
    const [orders, setOrders] = useState<Order[]>([]);

    // Team Management State
    const [newUser, setNewUser] = useState('');
    const [newRole, setNewRole] = useState<EnterpriseMember['role']>('DESIGNER');
    const [newLimit, setNewLimit] = useState(1000);

    // Procurement State
    const [bulkInput, setBulkInput] = useState('');
    const [bulkStatus, setBulkStatus] = useState('');

    // Current Global Config
    const [currentRate, setCurrentRate] = useState(0.06);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const ent = await dalGetEnterpriseProfile('ent_mega_corp');
        setProfile(ent);
        
        // Load enterprise orders (filtered by B2B flag in real app)
        const allOrders = await dalGetClientOrders();
        setOrders(allOrders.filter(o => o.isBulkOrder || o.customerName === ent.name));
        
        const status = adminBotService.getStatus();
        setCurrentRate(status.b2bRate);

        setLoading(false);
    };

    const handleAddMember = async () => {
        if (!newUser) return;
        await dalAddEnterpriseUser(newUser, newRole, newLimit);
        setNewUser('');
        loadData(); // Refresh list
    };

    const handleBulkOrder = async () => {
        if (!bulkInput) return;
        setBulkStatus('Processing...');
        
        try {
            // Parse input: SKU, QTY newline separated
            const lines = bulkInput.split('\n');
            const items = lines.map(line => {
                const [sku, qty] = line.split(',').map(s => s.trim());
                return { sku, quantity: parseInt(qty) || 0 };
            }).filter(i => i.sku && i.quantity > 0);

            if (items.length === 0) throw new Error("Invalid format");

            await dalSubmitBulkOrder(items);
            setBulkStatus('Order Placed Successfully!');
            setBulkInput('');
            loadData();
        } catch (e) {
            setBulkStatus('Error: Invalid Format. Use "SKU, QTY" per line.');
        }
    };

    if (loading || !profile) return <div className="p-10 text-center animate-pulse">Loading Enterprise Data...</div>;

    // Mock Current User Role (Assuming Admin/Manager access for demo)
    const currentUserRole = 'MANAGER'; 

    return (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-display font-bold text-white">{profile.name}</h2>
                    <p className="text-gray-400">Enterprise Portal • {profile.tier} Plan</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setActiveTab('DASHBOARD')} className={`px-4 py-2 rounded text-sm font-bold ${activeTab === 'DASHBOARD' ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-gray-400'}`}>Overview</button>
                    <button onClick={() => setActiveTab('TEAM')} className={`px-4 py-2 rounded text-sm font-bold ${activeTab === 'TEAM' ? 'bg-neon-purple/20 text-neon-purple' : 'text-gray-400'}`}>Team</button>
                    <button onClick={() => setActiveTab('PROCUREMENT')} className={`px-4 py-2 rounded text-sm font-bold ${activeTab === 'PROCUREMENT' ? 'bg-orange-500/20 text-orange-400' : 'text-gray-400'}`}>Bulk Buy</button>
                </div>
            </div>

            {/* DASHBOARD VIEW */}
            {activeTab === 'DASHBOARD' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <GlassCard className="border-neon-cyan/30">
                        <div className="text-xs text-gray-400 uppercase">Credit Balance</div>
                        <div className="text-3xl font-mono font-bold text-white">{profile.creditLine.toLocaleString()} Pi</div>
                        <div className="text-xs text-green-400 mt-2">Active Line of Credit</div>
                    </GlassCard>
                    <GlassCard className="border-neon-purple/30">
                        <div className="text-xs text-gray-400 uppercase">Active B2B Rate</div>
                        <div className="text-3xl font-mono font-bold text-neon-purple">{(profile.negotiatedCommission * 100).toFixed(1)}%</div>
                        <div className="text-xs text-gray-500 mt-2">Global Rate: {(currentRate * 100).toFixed(1)}%</div>
                    </GlassCard>
                    <GlassCard>
                        <div className="text-xs text-gray-400 uppercase">Active Members</div>
                        <div className="text-3xl font-bold text-white">{profile.members.length}</div>
                        <div className="text-xs text-gray-500 mt-2">3 Online Now</div>
                    </GlassCard>

                    {/* Recent Activity */}
                    <div className="md:col-span-3">
                        <GlassCard title="Procurement History">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="text-xs text-gray-500 border-b border-white/10">
                                            <th className="pb-2">Order ID</th>
                                            <th className="pb-2">Date</th>
                                            <th className="pb-2">Type</th>
                                            <th className="pb-2 text-right">Total</th>
                                            <th className="pb-2 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {orders.map(o => (
                                            <tr key={o.id} className="hover:bg-white/5">
                                                <td className="py-2 font-mono text-xs">{o.id}</td>
                                                <td className="py-2 text-gray-400">{new Date(o.timestamp).toLocaleDateString()}</td>
                                                <td className="py-2">
                                                    {o.isBulkOrder ? <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">BULK</span> : 'Standard'}
                                                </td>
                                                <td className="py-2 text-right font-bold">{o.total.toFixed(2)} Pi</td>
                                                <td className="py-2 text-right text-xs">{o.status}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            )}

            {/* TEAM MANAGEMENT VIEW */}
            {activeTab === 'TEAM' && (
                <div className="space-y-6">
                    {currentUserRole === 'MANAGER' || currentUserRole === 'ADMIN' ? (
                        <GlassCard className="border-neon-purple/30">
                            <h3 className="font-bold text-white mb-4">Add Team Member</h3>
                            <div className="flex gap-4">
                                <input 
                                    value={newUser} onChange={e => setNewUser(e.target.value)}
                                    placeholder="Username / Wallet"
                                    className="flex-1 bg-black/40 border border-white/10 rounded p-2 text-white"
                                />
                                <select 
                                    value={newRole} onChange={e => setNewRole(e.target.value as any)}
                                    className="bg-black/40 border border-white/10 rounded p-2 text-white"
                                >
                                    <option value="DESIGNER">Designer</option>
                                    <option value="ACCOUNTANT">Accountant</option>
                                    <option value="MANAGER">Manager</option>
                                </select>
                                <input 
                                    type="number" 
                                    value={newLimit} onChange={e => setNewLimit(parseInt(e.target.value))}
                                    placeholder="Limit"
                                    className="w-24 bg-black/40 border border-white/10 rounded p-2 text-white"
                                />
                                <button 
                                    onClick={handleAddMember}
                                    className="px-6 bg-neon-purple text-white font-bold rounded hover:bg-neon-purple/80"
                                >
                                    Add
                                </button>
                            </div>
                        </GlassCard>
                    ) : (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-center">
                            Restricted Access: Only Managers can add users.
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                        {profile.members.map(m => (
                            <GlassCard key={m.id} className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                                        m.role === 'MANAGER' ? 'bg-neon-purple' :
                                        m.role === 'ACCOUNTANT' ? 'bg-green-600' : 'bg-blue-600'
                                    }`}>
                                        {m.username[0]}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">{m.username}</h4>
                                        <p className="text-xs text-gray-400">{m.role}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-300">
                                        Spend: <span className="text-white font-bold">{m.spentThisMonth}</span> / {m.spendingLimit} Pi
                                    </div>
                                    <div className="w-32 h-1 bg-gray-700 rounded-full mt-1 ml-auto overflow-hidden">
                                        <div 
                                            className="bg-neon-cyan h-full" 
                                            style={{ width: `${Math.min(100, (m.spentThisMonth/m.spendingLimit)*100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </div>
            )}

            {/* BULK PROCUREMENT VIEW */}
            {activeTab === 'PROCUREMENT' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <GlassCard title="Bulk Order Form" className="border-orange-500/30">
                        <p className="text-sm text-gray-400 mb-4">
                            Enter SKU and Quantity per line. B2B Discounts applied automatically.
                        </p>
                        <textarea 
                            value={bulkInput} onChange={e => setBulkInput(e.target.value)}
                            className="w-full h-48 bg-black/40 border border-white/10 rounded p-4 font-mono text-sm text-white mb-4 focus:border-orange-500 outline-none"
                            placeholder="MAT-PLA-001, 500&#10;KIT-HAB-SML, 20"
                        />
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-300">
                                Commission Rate: <span className="text-green-400 font-bold">{(profile.negotiatedCommission * 100)}%</span>
                            </div>
                            <button 
                                onClick={handleBulkOrder}
                                className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded hover:shadow-lg transition-all"
                            >
                                Submit Bulk Order
                            </button>
                        </div>
                        {bulkStatus && (
                            <div className="mt-4 p-3 bg-white/5 rounded text-center text-sm text-neon-cyan animate-pulse">
                                {bulkStatus}
                            </div>
                        )}
                    </GlassCard>

                    <GlassCard title="B2B Catalog Reference">
                        <div className="space-y-2 text-sm text-gray-400">
                            <div className="flex justify-between border-b border-white/5 pb-1">
                                <span>MAT-PLA-001</span>
                                <span>PLA Filament (High Grade)</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-1">
                                <span>MAT-ECO-001</span>
                                <span>Eco-Recycled PLA</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-1">
                                <span>KIT-HAB-SML</span>
                                <span>Micro-Habitat Kit</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-1">
                                <span>ACC-SOL-PNL</span>
                                <span>Solar Cell Add-on</span>
                            </div>
                        </div>
                        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded text-xs text-blue-300">
                            <strong>Volume Discount:</strong> Orders > 50 units receive an automatic 10% discount on unit price.
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};
