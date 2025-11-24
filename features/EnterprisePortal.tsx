
import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { dalGetEnterpriseProfile, dalAddEnterpriseUser, dalSubmitBulkOrder, dalGetClientOrders, dalSubmitKYBDocs, dalGetRFQs } from '../services/dataAccessLayer';
import { adminBotService } from '../services/adminBotService';
import { zkService } from '../services/zkService'; // Phase 9.5
import { EnterpriseProfile, EnterpriseMember, Order, RFQ, ZKProof } from '../types';

export const EnterprisePortal: React.FC = () => {
    const [profile, setProfile] = useState<EnterpriseProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'TEAM' | 'PROCUREMENT' | 'VERIFICATION' | 'RFQ' | 'PRIVACY'>('DASHBOARD');
    const [orders, setOrders] = useState<Order[]>([]);
    const [rfqs, setRfqs] = useState<RFQ[]>([]);

    // Team Management State
    const [newUser, setNewUser] = useState('');
    const [newRole, setNewRole] = useState<EnterpriseMember['role']>('DESIGNER');
    const [newLimit, setNewLimit] = useState(1000);

    // Procurement State
    const [bulkInput, setBulkInput] = useState('');
    const [bulkStatus, setBulkStatus] = useState('');
    const [isRequestingQuote, setIsRequestingQuote] = useState(false);

    // KYB State
    const [kybFile, setKybFile] = useState<File | null>(null);

    // ZK State
    const [zkThreshold, setZkThreshold] = useState(50000);
    const [generatingProof, setGeneratingProof] = useState(false);
    const [activeProof, setActiveProof] = useState<ZKProof | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const ent = await dalGetEnterpriseProfile('ent_mega_corp');
        setProfile(ent);
        
        const allOrders = await dalGetClientOrders();
        setOrders(allOrders.filter(o => o.isBulkOrder || o.customerName === ent.name));
        
        const rfqData = await dalGetRFQs();
        setRfqs(rfqData);

        setLoading(false);
    };

    const handleAddMember = async () => {
        if (!newUser) return;
        await dalAddEnterpriseUser(newUser, newRole, newLimit);
        setNewUser('');
        loadData(); 
    };

    const handleBulkSubmit = async (asRFQ: boolean) => {
        if (!bulkInput) return;
        setBulkStatus(asRFQ ? 'Generating RFQ...' : 'Processing Order...');
        
        try {
            const lines = bulkInput.split('\n');
            const items = lines.map(line => {
                const [sku, qty] = line.split(',').map(s => s.trim());
                return { sku, quantity: parseInt(qty) || 0 };
            }).filter(i => i.sku && i.quantity > 0);

            if (items.length === 0) throw new Error("Invalid format");

            // Simulate user role as PROCUREMENT for this test
            const res = await dalSubmitBulkOrder(items, asRFQ, 'PROCUREMENT');
            
            if (asRFQ) {
                setBulkStatus('RFQ Created! Suppliers notified.');
            } else {
                setBulkStatus(res.status === 'AWAITING_APPROVAL' ? 'Order Pending Multi-Sig Approval (Over Limit)' : 'Order Placed Successfully!');
            }
            setBulkInput('');
            loadData();
        } catch (e: any) {
            setBulkStatus(`Error: ${e.message}`);
        }
    };

    const handleKYBUpload = async () => {
        if (!kybFile) return;
        await dalSubmitKYBDocs(kybFile, 'COMMERCIAL_REGISTER');
        alert("Document Uploaded. Admin Review triggered.");
        loadData();
    };

    const handleGenerateSolvencyProof = async () => {
        setGeneratingProof(true);
        try {
            const mockBalance = 150000; // Profile credit line + wallet
            const proof = await zkService.generateSolvencyProof(profile?.mainWallet || '', mockBalance, zkThreshold);
            setActiveProof(proof);
        } catch (e: any) {
            alert(e.message);
        } finally {
            setGeneratingProof(false);
        }
    };

    if (loading || !profile) return <div className="p-10 text-center animate-pulse">Loading Enterprise Data...</div>;

    return (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-display font-bold text-white">{profile.name}</h2>
                    <div className="flex items-center gap-2 text-gray-400">
                        <span>Enterprise Portal</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${profile.verificationStatus === 'VERIFIED' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-yellow-500/20 border-yellow-500 text-yellow-400'}`}>
                            {profile.verificationStatus}
                        </span>
                    </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {['DASHBOARD', 'TEAM', 'PROCUREMENT', 'RFQ', 'VERIFICATION', 'PRIVACY'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab as any)} 
                            className={`px-3 py-1 rounded text-xs font-bold border transition-all ${activeTab === tab ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan' : 'bg-white/5 border-white/10 text-gray-400'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* DASHBOARD VIEW */}
            {activeTab === 'DASHBOARD' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <GlassCard className="border-neon-cyan/30">
                        <div className="text-xs text-gray-400 uppercase">Credit Balance</div>
                        <div className="text-3xl font-mono font-bold text-white">{profile.creditLine.toLocaleString()} Pi</div>
                    </GlassCard>
                    <GlassCard className="border-neon-purple/30">
                        <div className="text-xs text-gray-400 uppercase">Negotiated Rate</div>
                        <div className="text-3xl font-mono font-bold text-neon-purple">{(profile.negotiatedCommission * 100).toFixed(1)}%</div>
                    </GlassCard>
                    <GlassCard>
                        <div className="text-xs text-gray-400 uppercase">Multi-Sig Status</div>
                        <div className="text-xl font-bold text-white">{profile.multiSigEnabled ? 'ACTIVE' : 'DISABLED'}</div>
                        <div className="text-[10px] text-gray-500">Requires {profile.requiredSignatures} Approvals</div>
                    </GlassCard>
                </div>
            )}

            {/* TEAM MANAGEMENT (RBAC) */}
            {activeTab === 'TEAM' && (
                <div className="space-y-6">
                    <GlassCard className="border-neon-purple/30">
                        <h3 className="font-bold text-white mb-4">Add Team Member (RBAC)</h3>
                        <div className="flex gap-4 flex-wrap">
                            <input value={newUser} onChange={e => setNewUser(e.target.value)} placeholder="Username" className="bg-black/40 border border-white/10 rounded p-2 text-white" />
                            <select value={newRole} onChange={e => setNewRole(e.target.value as any)} className="bg-black/40 border border-white/10 rounded p-2 text-white">
                                <option value="DESIGNER">Designer (View/Edit)</option>
                                <option value="PROCUREMENT">Procurement (Buy)</option>
                                <option value="MANAGER">Manager (Admin)</option>
                                <option value="AUDITOR">Auditor (View Only)</option>
                                <option value="TECHNICAL">Technical (Specs Only)</option>
                            </select>
                            <input type="number" value={newLimit} onChange={e => setNewLimit(parseInt(e.target.value))} placeholder="Limit" className="w-24 bg-black/40 border border-white/10 rounded p-2 text-white" />
                            <button onClick={handleAddMember} className="px-6 bg-neon-purple text-white font-bold rounded">Add</button>
                        </div>
                    </GlassCard>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 border-b border-white/10">
                                <tr><th>User</th><th>Role</th><th>Permissions</th><th>Limit</th></tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {profile.members.map(m => (
                                    <tr key={m.id} className="hover:bg-white/5">
                                        <td className="py-3 font-bold text-white">{m.username}</td>
                                        <td className="py-3"><span className="text-xs bg-white/10 px-2 py-1 rounded">{m.role}</span></td>
                                        <td className="py-3 text-xs text-gray-400">
                                            {m.role === 'MANAGER' && 'FULL ACCESS'}
                                            {m.role === 'PROCUREMENT' && 'Create Orders, RFQs'}
                                            {m.role === 'AUDITOR' && 'View Financials'}
                                            {m.role === 'TECHNICAL' && 'View Specs, No Buy'}
                                        </td>
                                        <td className="py-3 font-mono">{m.spendingLimit} Pi</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* RFQ HUB */}
            {activeTab === 'RFQ' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <h3 className="font-bold text-white">Active RFQs</h3>
                        {rfqs.length === 0 ? <div className="p-8 border border-dashed border-white/10 text-center text-gray-500">No active requests.</div> : 
                            rfqs.map(rfq => (
                                <GlassCard key={rfq.id} className="border-orange-500/20">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-white">{rfq.title}</h4>
                                            <div className="text-xs text-gray-400">ID: {rfq.id} • {rfq.items.length} Items</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-orange-400 font-bold">{rfq.status}</div>
                                            <div className="text-[10px] text-gray-500">{rfq.bids.length} Blind Bids</div>
                                        </div>
                                    </div>
                                    {/* Bid List (Blind Logic) */}
                                    <div className="mt-4 bg-black/20 p-2 rounded space-y-1">
                                        {rfq.bids.map(bid => (
                                            <div key={bid.id} className="flex justify-between text-xs p-2 bg-white/5 rounded">
                                                <span className="text-gray-300">{rfq.status === 'OPEN' ? '***** (Sealed)' : bid.supplierName}</span>
                                                <span className="font-mono text-neon-cyan">{rfq.status === 'OPEN' ? '**** Pi' : `${bid.amount} Pi`}</span>
                                            </div>
                                        ))}
                                        {rfq.bids.length === 0 && <div className="text-xs text-gray-600 italic">Waiting for suppliers...</div>}
                                    </div>
                                </GlassCard>
                            ))
                        }
                    </div>
                    <div className="bg-white/5 rounded p-4">
                        <h4 className="font-bold text-white mb-2">Blind Bidding Rules</h4>
                        <ul className="text-xs text-gray-400 space-y-2 list-disc pl-4">
                            <li>Suppliers cannot see competing bids.</li>
                            <li>All bids are sealed until deadline.</li>
                            <li>Lowest bid is not mandatory; Quality score applies.</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* PROCUREMENT (Bulk & RFQ Create) */}
            {activeTab === 'PROCUREMENT' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <GlassCard title="Procurement Console" className="border-orange-500/30">
                        <textarea 
                            value={bulkInput} onChange={e => setBulkInput(e.target.value)}
                            className="w-full h-40 bg-black/40 border border-white/10 rounded p-4 font-mono text-sm text-white mb-4"
                            placeholder="MAT-PLA-001, 5000&#10;KIT-HAB-SML, 200"
                        />
                        <div className="flex gap-3">
                            <button 
                                onClick={() => handleBulkSubmit(false)}
                                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded"
                            >
                                Direct Buy
                            </button>
                            <button 
                                onClick={() => handleBulkSubmit(true)}
                                className="flex-1 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded"
                            >
                                Request Quote (RFQ)
                            </button>
                        </div>
                        {bulkStatus && <div className="mt-4 text-center text-xs text-neon-cyan animate-pulse">{bulkStatus}</div>}
                    </GlassCard>
                    
                    <GlassCard title="Integration">
                        <div className="p-4 bg-black/30 rounded border border-white/10 mb-4">
                            <div className="text-xs text-gray-500 uppercase font-bold">Client ERP Sync Endpoint</div>
                            <code className="text-xs text-neon-purple block mt-1">POST https://api.architex.net/v1/enterprise/orders/draft</code>
                        </div>
                        <p className="text-xs text-gray-400">
                            Connect your internal SAP/Oracle system to auto-draft orders when inventory is low.
                        </p>
                    </GlassCard>
                </div>
            )}

            {/* VERIFICATION (KYB) */}
            {activeTab === 'VERIFICATION' && (
                <GlassCard title="Business Verification (KYB)">
                    <div className="flex items-center gap-4 mb-6">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl border ${profile.verificationStatus === 'VERIFIED' ? 'bg-green-500/20 border-green-500' : 'bg-gray-500/20 border-gray-500'}`}>
                            {profile.verificationStatus === 'VERIFIED' ? '✓' : '?'}
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Status: {profile.verificationStatus}</h3>
                            <p className="text-xs text-gray-400">Upload Commercial Register to unlock higher limits.</p>
                        </div>
                    </div>
                    
                    {profile.verificationStatus !== 'VERIFIED' && (
                        <div className="space-y-4">
                            <input type="file" onChange={e => setKybFile(e.target.files?.[0] || null)} className="text-sm text-gray-400" />
                            <button onClick={handleKYBUpload} className="px-6 py-2 bg-neon-cyan/20 border border-neon-cyan text-neon-cyan rounded font-bold">
                                Upload Document
                            </button>
                        </div>
                    )}
                </GlassCard>
            )}

            {/* PRIVACY (ZK PROOFS) */}
            {activeTab === 'PRIVACY' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <GlassCard title="Zero-Knowledge Proof Engine">
                        <p className="text-sm text-gray-400 mb-4">
                            Prove financial solvency to suppliers or auditors without revealing your exact wallet balance.
                        </p>
                        
                        <div className="bg-white/5 p-4 rounded-lg border border-white/10 mb-6">
                            <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Proof Threshold (Pi)</label>
                            <input 
                                type="number" 
                                value={zkThreshold} 
                                onChange={e => setZkThreshold(parseInt(e.target.value))}
                                className="w-full bg-black/40 border border-white/10 rounded p-3 text-white font-mono outline-none focus:border-neon-purple"
                            />
                            <p className="text-[10px] text-gray-500 mt-2">
                                Generating proof: "Wallet {profile.mainWallet.substring(0,6)}... has balance &ge; {zkThreshold.toLocaleString()} Pi"
                            </p>
                        </div>

                        <button 
                            onClick={handleGenerateSolvencyProof}
                            disabled={generatingProof}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {generatingProof ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Generating zk-SNARK...
                                </>
                            ) : (
                                <span>Generate Solvency Proof</span>
                            )}
                        </button>
                    </GlassCard>

                    <GlassCard title="Proof Output">
                        {activeProof ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-green-400 font-bold">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Proof Generated Successfully
                                </div>
                                <div className="bg-black/50 p-4 rounded border border-white/10 font-mono text-xs text-gray-400 break-all">
                                    {activeProof.proof}
                                </div>
                                <div className="text-xs text-gray-500">
                                    Hash: {activeProof.id} <br/>
                                    Timestamp: {new Date(activeProof.timestamp).toLocaleString()}
                                </div>
                                <button className="text-xs text-neon-cyan underline">Copy to Clipboard</button>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-600 text-sm">
                                No proof generated yet.
                            </div>
                        )}
                    </GlassCard>
                </div>
            )}
        </div>
    );
};
