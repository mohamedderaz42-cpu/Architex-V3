

import React, { useEffect, useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { bountySmartContract } from '../services/bountySmartContract';
import { Bounty, BountyStatus, ContractPayout } from '../types';
import { piService } from '../services/piService';
import { CONTRACT_CONFIG } from '../constants';

export const BountyMarketplace: React.FC = () => {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'BROWSE' | 'CREATE'>('BROWSE');
  
  // Create Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Contract Action State
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [lastPayout, setLastPayout] = useState<ContractPayout | null>(null);

  // Mock User Identity (In real app, comes from UserSession)
  const CURRENT_USER = 'PiUser_Alpha'; 

  useEffect(() => {
    loadContractState();
  }, []);

  const loadContractState = async () => {
    setLoading(true);
    const data = await bountySmartContract.getAllBounties();
    setBounties(data);
    setLoading(false);
  };

  const handleCreateBounty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formPrice) return;

    setIsCreating(true);
    const priceVal = parseFloat(formPrice);

    // 1. Escrow Funds via Pi SDK (Routed strictly to Escrow Contract)
    try {
      await piService.createEscrowPayment(
        `Escrow Deposit: ${formTitle}`,
        priceVal,
        {
          onReadyForServerApproval: async (pid) => console.log('Escrow Payment Initiated', pid),
          onReadyForServerCompletion: async (pid, txid) => {
             // 2. Create Contract Entry (Locks Funds)
             await bountySmartContract.createBounty(formTitle, formDesc, priceVal, CURRENT_USER);
             setFormTitle('');
             setFormDesc('');
             setFormPrice('');
             setActiveTab('BROWSE');
             loadContractState();
             setIsCreating(false);
          },
          onCancel: () => setIsCreating(false),
          onError: (e) => {
            alert('Escrow Deposit Failed on Pi Network');
            setIsCreating(false);
          }
        }
      );
    } catch (err) {
      console.error(err);
      setIsCreating(false);
    }
  };

  const handleClaim = async (bounty: Bounty) => {
    setProcessingId(bounty.id);
    await bountySmartContract.claimBounty(bounty.id, CURRENT_USER);
    loadContractState();
    setProcessingId(null);
  };

  const handleSubmitWork = async (bounty: Bounty) => {
    setProcessingId(bounty.id);
    await bountySmartContract.submitWork(bounty.id);
    loadContractState();
    setProcessingId(null);
  };

  const handleApprove = async (bounty: Bounty) => {
    setProcessingId(bounty.id);
    try {
      // This calls the secure release function
      const payout = await bountySmartContract.executeContract(bounty.id);
      setLastPayout(payout);
      loadContractState();
    } catch (e: any) {
      alert(`Contract Execution Error: ${e.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-display font-bold text-white">Bounty Marketplace</h2>
          <p className="text-gray-400 text-sm flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Smart Contract Escrow Active
          </p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setActiveTab('BROWSE')}
             className={`px-4 py-2 rounded-lg text-sm font-bold ${activeTab === 'BROWSE' ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50' : 'bg-white/5 text-gray-400'}`}
           >
             Browse Jobs
           </button>
           <button 
             onClick={() => setActiveTab('CREATE')}
             className={`px-4 py-2 rounded-lg text-sm font-bold ${activeTab === 'CREATE' ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/50' : 'bg-white/5 text-gray-400'}`}
           >
             Post Bounty
           </button>
        </div>
      </div>

      {lastPayout && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg flex items-center justify-between animate-[slideDown_0.3s_ease-out]">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </div>
             <div>
                <div className="text-green-400 font-bold">Escrow Released Successfully</div>
                <div className="text-xs text-green-300">Funds transferred via Smart Contract</div>
                {lastPayout.discountApplied && (
                    <div className="text-[10px] bg-neon-purple/20 text-neon-purple px-2 py-0.5 rounded border border-neon-purple/30 mt-1 inline-block font-bold">
                        💎 Staker Discount Active (-50% Fees)
                    </div>
                )}
             </div>
          </div>
          <div className="text-right text-xs font-mono">
             <div className="opacity-50">CONTRACT ID: {Date.now().toString().substr(-6)}</div>
             <div className="text-white font-bold text-lg">{lastPayout.designerAmount.toFixed(2)} Pi <span className="text-xs font-normal text-gray-400">to Designer</span></div>
             <div className="text-neon-purple">+{lastPayout.platformFee.toFixed(2)} Pi <span className="text-xs text-gray-400">Protocol Fee</span></div>
          </div>
          <button onClick={() => setLastPayout(null)} className="ml-4 text-green-400 font-bold hover:text-white">×</button>
        </div>
      )}

      {activeTab === 'CREATE' && (
        <GlassCard className="max-w-2xl mx-auto border-neon-purple/30">
          <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-4">
            <svg className="w-6 h-6 text-neon-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            <h3 className="text-xl font-bold">Secure Bounty Escrow</h3>
          </div>
          
          <form onSubmit={handleCreateBounty} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Project Title</label>
              <input 
                value={formTitle} onChange={e => setFormTitle(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded p-3 text-white focus:border-neon-purple outline-none"
                placeholder="e.g. 3D Model for Solar Roof"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Requirements</label>
              <textarea 
                value={formDesc} onChange={e => setFormDesc(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded p-3 text-white focus:border-neon-purple outline-none h-32"
                placeholder="Detailed deliverables..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Bounty Amount (Pi)</label>
                <input 
                  type="number" value={formPrice} onChange={e => setFormPrice(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded p-3 text-white font-mono focus:border-neon-purple outline-none"
                  placeholder="0.00"
                />
              </div>
              <div className="bg-white/5 rounded p-3 border border-white/5 flex flex-col justify-center relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-1">
                    <svg className="w-12 h-12 text-white/5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3z"/></svg>
                 </div>
                 <div className="flex justify-between text-xs mb-1 relative z-10">
                    <span className="text-gray-400">Lock Amount:</span>
                    <span className="text-white font-bold">{formPrice || '0'} Pi</span>
                 </div>
                 <div className="flex justify-between text-xs relative z-10">
                    <span className="text-gray-400">Protocol Fee (10%):</span>
                    <span className="text-neon-cyan font-bold">{(parseFloat(formPrice || '0') * 0.10).toFixed(2)} Pi</span>
                 </div>
              </div>
            </div>
            <button 
              disabled={isCreating}
              className="w-full py-4 bg-gradient-to-r from-neon-purple to-indigo-600 rounded-lg font-bold text-white hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] disabled:opacity-50 transition-all flex justify-center items-center gap-2"
            >
              {isCreating ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>Verifying & Locking Funds...</span>
                  </>
              ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    <span>Deposit to Escrow & Post</span>
                  </>
              )}
            </button>
          </form>
        </GlassCard>
      )}

      {activeTab === 'BROWSE' && (
        <div className="grid grid-cols-1 gap-4">
          {bounties.map(bounty => (
            <GlassCard key={bounty.id} className="flex flex-col md:flex-row gap-4 justify-between items-center group hover:border-white/20 transition-all">
               <div className="flex-1">
                 <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg text-white">{bounty.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 ${
                      bounty.status === BountyStatus.OPEN ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      bounty.status === BountyStatus.COMPLETED ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' :
                      'bg-orange-500/20 text-orange-400 border-orange-500/30'
                    }`}>
                      {bounty.status === BountyStatus.OPEN && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>}
                      {bounty.status}
                    </span>
                    {bounty.status !== BountyStatus.COMPLETED && (
                        <span className="text-[10px] text-gray-500 border border-gray-700 px-1 rounded bg-black/30" title="Funds Locked in Contract">
                            🔒 Escrowed
                        </span>
                    )}
                 </div>
                 <p className="text-sm text-gray-400 mb-3">{bounty.description}</p>
                 <div className="flex gap-4 text-xs font-mono text-gray-500">
                    <span>Client: <span className="text-white">{bounty.client}</span></span>
                    <span>Designer: <span className="text-white">{bounty.designer || '---'}</span></span>
                 </div>
               </div>

               <div className="flex flex-col items-end gap-3 min-w-[140px]">
                  <div className="text-2xl font-bold text-neon-cyan font-mono">
                    {bounty.price} π
                  </div>
                  
                  {/* Action Logic based on User Role and Status */}
                  {bounty.status === BountyStatus.OPEN && (
                    <button 
                      onClick={() => handleClaim(bounty)}
                      disabled={!!processingId}
                      className="px-4 py-2 bg-white/10 hover:bg-neon-cyan/20 text-white border border-white/20 hover:border-neon-cyan rounded-lg text-sm font-bold transition-all w-full"
                    >
                       {processingId === bounty.id ? 'Claiming...' : 'Claim Job'}
                    </button>
                  )}

                  {bounty.status === BountyStatus.ASSIGNED && bounty.designer === CURRENT_USER && (
                    <button 
                      onClick={() => handleSubmitWork(bounty)}
                      disabled={!!processingId}
                      className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/50 rounded-lg text-sm font-bold transition-all w-full"
                    >
                       {processingId === bounty.id ? 'Uploading...' : 'Submit Work'}
                    </button>
                  )}

                  {bounty.status === BountyStatus.SUBMITTED && (bounty.client === CURRENT_USER || bounty.client === 'MuskFan_99') && (
                    <button 
                      onClick={() => handleApprove(bounty)}
                      disabled={!!processingId}
                      className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white border border-green-500/50 rounded-lg text-sm font-bold transition-all w-full shadow-lg shadow-green-500/20"
                    >
                       {processingId === bounty.id ? 'Verifying...' : 'Approve & Release'}
                    </button>
                  )}
               </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};