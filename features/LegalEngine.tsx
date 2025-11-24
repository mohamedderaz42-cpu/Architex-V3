
import React, { useState, useRef } from 'react';
import { GlassCard } from '../components/GlassCard';
import { legalService, ContractParams } from '../services/legalService';
import { LegalAgreement } from '../types';

export const LegalEngine: React.FC = () => {
  const [view, setView] = useState<'LIST' | 'CREATE' | 'SIGN'>('LIST');
  const [agreements, setAgreements] = useState<LegalAgreement[]>([]);
  const [activeAgreement, setActiveAgreement] = useState<LegalAgreement | null>(null);
  const [processing, setProcessing] = useState(false);

  // Form State
  const [formData, setFormData] = useState<ContractParams>({
    type: 'SERVICE_AGREEMENT',
    initiator: 'PiUser_Alpha', // Default current user
    counterparty: '',
    projectScope: '',
    value: '',
    jurisdiction: 'Decentralized Autonomous Organization (DAO)'
  });

  const [signature, setSignature] = useState('');

  const handleGenerate = async () => {
    if (!formData.counterparty || !formData.projectScope) {
        alert("Please fill in all fields");
        return;
    }
    const draft = await legalService.createDraft(formData);
    setActiveAgreement(draft);
    setView('SIGN');
  };

  const handleSignAndMint = async () => {
    if (!activeAgreement || !signature) return;
    setProcessing(true);
    try {
        const notarized = await legalService.notarizeAgreement(activeAgreement.id, signature);
        
        // Update local list
        const exists = agreements.find(a => a.id === notarized.id);
        if (!exists) {
            setAgreements(prev => [notarized, ...prev]);
        } else {
            setAgreements(prev => prev.map(a => a.id === notarized.id ? notarized : a));
        }
        
        setActiveAgreement(notarized);
    } catch (e) {
        alert("Notarization failed");
    } finally {
        setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-3xl font-display font-bold text-white">Legal Engine</h2>
                <p className="text-gray-400">Generate, Sign, and Notarize contracts on the Blockchain.</p>
            </div>
            {view !== 'LIST' && (
                <button 
                    onClick={() => { setView('LIST'); setActiveAgreement(null); }}
                    className="text-sm text-gray-400 hover:text-white"
                >
                    Back to Archive
                </button>
            )}
        </div>

        {view === 'LIST' && (
            <div className="space-y-6">
                <GlassCard className="border-neon-purple/30">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h3 className="text-xl font-bold text-white">Create New Agreement</h3>
                            <p className="text-sm text-gray-400">Select a template to begin drafting.</p>
                        </div>
                        <button 
                            onClick={() => setView('CREATE')}
                            className="px-6 py-3 bg-neon-purple text-white font-bold rounded-lg shadow-lg shadow-neon-purple/20 hover:bg-neon-purple/80 transition-all"
                        >
                            + New Contract
                        </button>
                    </div>
                </GlassCard>

                <div className="grid grid-cols-1 gap-4">
                    <h3 className="text-lg font-bold text-gray-300 mt-4">Contract Archive</h3>
                    {agreements.length === 0 ? (
                        <div className="text-center py-10 text-gray-500 border border-white/5 rounded-xl bg-white/5">
                            No agreements found. Create one to secure your work.
                        </div>
                    ) : (
                        agreements.map(agree => (
                            <GlassCard key={agree.id} className="flex justify-between items-center hover:border-white/20 cursor-pointer" onClick={() => { setActiveAgreement(agree); setView('SIGN'); }}>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-white">{agree.type.replace('_', ' ')}</h4>
                                        {agree.status === 'NOTARIZED' && (
                                            <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30">Verified</span>
                                        )}
                                        {agree.status === 'DRAFT' && (
                                            <span className="text-[10px] bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded border border-gray-500/30">Draft</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 font-mono">ID: {agree.id}</p>
                                </div>
                                <div className="text-right text-xs">
                                    <div className="text-gray-400">{new Date(agree.timestamp).toLocaleDateString()}</div>
                                    <div className="text-neon-cyan truncate w-32">{agree.parties.counterparty}</div>
                                </div>
                            </GlassCard>
                        ))
                    )}
                </div>
            </div>
        )}

        {view === 'CREATE' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <GlassCard title="Contract Details">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Contract Type</label>
                            <select 
                                value={formData.type}
                                onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                                className="w-full bg-black/40 border border-white/10 rounded p-3 text-white outline-none focus:border-neon-purple"
                            >
                                <option value="SERVICE_AGREEMENT">Service Agreement</option>
                                <option value="IP_TRANSFER">IP Transfer (NFT)</option>
                                <option value="NDA">Non-Disclosure Agreement</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Counterparty (Username/Wallet)</label>
                            <input 
                                value={formData.counterparty}
                                onChange={(e) => setFormData({...formData, counterparty: e.target.value})}
                                className="w-full bg-black/40 border border-white/10 rounded p-3 text-white outline-none focus:border-neon-purple"
                                placeholder="e.g. EcoBuilder_Pi"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Project Scope / Deliverables</label>
                            <textarea 
                                value={formData.projectScope}
                                onChange={(e) => setFormData({...formData, projectScope: e.target.value})}
                                className="w-full bg-black/40 border border-white/10 rounded p-3 text-white outline-none focus:border-neon-purple h-24"
                                placeholder="Describe the work or assets..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Value / Consideration</label>
                            <input 
                                value={formData.value}
                                onChange={(e) => setFormData({...formData, value: e.target.value})}
                                className="w-full bg-black/40 border border-white/10 rounded p-3 text-white outline-none focus:border-neon-purple"
                                placeholder="e.g. 500 Pi + 5% Royalty"
                            />
                        </div>
                        <button 
                            onClick={handleGenerate}
                            className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-bold transition-all mt-4"
                        >
                            Generate Draft
                        </button>
                    </div>
                </GlassCard>
                
                {/* Visual Placeholder */}
                <div className="hidden lg:flex flex-col items-center justify-center p-8 border border-white/5 rounded-2xl bg-white/5 text-gray-500 text-center">
                    <svg className="w-24 h-24 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <p>Fill in the details to preview the dynamically generated legal document.</p>
                </div>
            </div>
        )}

        {view === 'SIGN' && activeAgreement && (
             <div className="flex flex-col gap-6">
                {/* Document View */}
                <div className="bg-white text-black p-8 md:p-12 rounded-sm shadow-2xl mx-auto max-w-3xl w-full min-h-[600px] font-serif relative">
                    {/* Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                        <div className="text-6xl font-black rotate-45 uppercase">Architex Secure</div>
                    </div>

                    <div className="border-b-2 border-black pb-4 mb-8 flex justify-between items-end">
                        <h1 className="text-2xl font-bold uppercase tracking-wider">{activeAgreement.type.replace('_', ' ')}</h1>
                        <span className="font-mono text-xs">ID: {activeAgreement.id}</span>
                    </div>

                    <div className="whitespace-pre-wrap leading-relaxed text-sm">
                        {activeAgreement.content}
                    </div>

                    <div className="mt-12 pt-8 border-t border-black flex justify-between items-end">
                        <div className="w-1/2 pr-8">
                            <div className="border-b border-black mb-2 h-12 flex items-end">
                                {activeAgreement.signature && (
                                    <span className="font-handwriting text-2xl text-blue-900 ml-4">{activeAgreement.signature}</span>
                                )}
                            </div>
                            <p className="text-xs uppercase font-bold">Signed By: {activeAgreement.parties.initiator}</p>
                        </div>
                        
                        {activeAgreement.status === 'NOTARIZED' && (
                            <div className="w-32 h-32 border-4 border-double border-red-800 rounded-full flex flex-col items-center justify-center text-red-800 rotate-[-15deg] opacity-80">
                                <span className="text-[10px] uppercase font-bold tracking-widest">Architex</span>
                                <span className="text-xs font-black uppercase">Notarized</span>
                                <span className="text-[8px] font-mono mt-1">{new Date(activeAgreement.timestamp).toLocaleDateString()}</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 text-[8px] text-gray-400 font-mono text-center">
                        DOCUMENT HASH (SHA-256):<br/>
                        {activeAgreement.contentHash}
                    </div>
                </div>

                {/* Action Bar */}
                {activeAgreement.status === 'DRAFT' ? (
                     <GlassCard className="sticky bottom-4 border-neon-cyan/50 backdrop-blur-xl">
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <input 
                                type="text" 
                                value={signature}
                                onChange={(e) => setSignature(e.target.value)}
                                placeholder="Type Full Name to Sign"
                                className="flex-1 bg-black/40 border border-white/20 rounded p-3 text-white outline-none focus:border-neon-cyan font-serif italic text-lg"
                            />
                            <button 
                                onClick={handleSignAndMint}
                                disabled={!signature || processing}
                                className="px-8 py-3 bg-gradient-to-r from-neon-cyan to-blue-600 text-white font-bold rounded-lg shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                            >
                                {processing ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Signing & Minting...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        Sign & Notarize (On-Chain)
                                    </>
                                )}
                            </button>
                        </div>
                     </GlassCard>
                ) : (
                    <GlassCard className="border-green-500/30">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-green-400 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                    Proof of Existence Verified
                                </h3>
                                <p className="text-xs text-gray-400 font-mono mt-1 break-all">
                                    TXID: {activeAgreement.blockchainTxId}
                                </p>
                            </div>
                            <button className="px-4 py-2 border border-white/20 rounded hover:bg-white/5 text-sm">Download PDF</button>
                        </div>
                    </GlassCard>
                )}
             </div>
        )}
    </div>
  );
};
