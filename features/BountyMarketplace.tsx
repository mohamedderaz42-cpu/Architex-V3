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

    // 1. Escrow Funds via Pi SDK
    try {
      await piService.createPayment(
        `Escrow: ${formTitle}`,
        priceVal,
        {
          onReadyForServerApproval: async (pid) => console.log('Escrow Approved', pid),
          onReadyForServerCompletion: async (pid, txid) => {
             // 2. Create Contract Entry
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
            alert('Payment Failed');
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
      const payout = await bountySmartContract.executeContract(bounty.id);
      setLastPayout(payout);
      loadContractState();
    } catch (e) {
      alert("Contract Execution Failed");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-display font-bold text-white">Bounty Marketplace</h2>
          <p className="text-gray-400 text-sm">Decentralized Design Tasks • Smart Contract Escrow</p>
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
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg flex items-center justify-between animate-pulse">
          <div>
            <div className="text-green-400 font-bold">Contract Executed Successfully</div>
            <div className="text-xs text-green-300">Funds released from Escrow</div>
          </div>
          <div className="text-right text-xs font-mono">
             <div>Total: {lastPayout.total.toFixed(2)} Pi</div>
             <div className="text-white font-bold">Designer: {lastPayout.designerAmount.toFixed(2)} Pi</div>
             <div className="text-gray-400">Platform Fee (10%): {lastPayout.platformFee.toFixed(2)} Pi</div>
          </div>
          <button onClick={() => setLastPayout(null)} className="ml-4 text-green-400 font-bold">×</button>
        </div>
      )}

      {activeTab === 'CREATE' && (
        <GlassCard className="max-w-2xl mx-auto border-neon-purple/30">
          <h3 className="text-xl font-bold mb-4">Create New Design Bounty</h3>
          <form onSubmit={handleCreateBounty} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Title</label>
              <input 
                value={formTitle} onChange={e => setFormTitle(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded p-3 text-white focus:border-neon-purple outline-none"
                placeholder="e.g. 3D Model for Solar Roof"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Description</label>
              <textarea 
                value={formDesc} onChange={e => setFormDesc(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded p-3 text-white focus:border-neon-purple outline-none h-32"
                placeholder="Detailed requirements..."
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
              <div className="bg-white/5 rounded p-3 border border-white/5 flex flex-col justify-center">
                 <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Escrow Amount:</span>
                    <span className="text-white font-bold">{formPrice || '0'} Pi</span>
                 </div>
                 <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Platform Fee:</span>
                    <span className="text-neon-cyan font-bold">{(parseFloat(formPrice || '0') * 0.10).toFixed(2)} Pi</span>
                 </div>
                 <div className="text-[10px] text-gray-500 mt-2">
                    * Fee deducted upon completion
                 </div>
              </div>
            </div>
            <button 
              disabled={isCreating}
              className="w-full py-3 bg-gradient-to-r from-neon-purple to-pink-600 rounded-lg font-bold text-white hover:shadow-[0_0_15px_rgba(188,19,254,0.4)] disabled:opacity-50"
            >
              {isCreating ? 'Processing Pi Payment...' : 'Lock Funds & Post Bounty'}
            </button>
          </form>
        </GlassCard>
      )}

      {activeTab === 'BROWSE' && (
        <div className="grid grid-cols-1 gap-4">
          {bounties.map(bounty => (
            <GlassCard key={bounty.id} className="flex flex-col md:flex-row gap-4 justify-between items-center group hover:border-white/20 transition-all">
               <div className="flex-1">
                 <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg text-white">{bounty.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${
                      bounty.status === BountyStatus.OPEN ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      bounty.status === BountyStatus.COMPLETED ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' :
                      'bg-orange-500/20 text-orange-400 border-orange-500/30'
                    }`}>
                      {bounty.status}
                    </span>
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
                      className="px-4 py-2 bg-white/10 hover:bg-neon-cyan/20 text-white border border-white/20 hover:border-neon-cyan rounded-lg text-sm font-bold transition-all"
                    >
                       {processingId === bounty.id ? 'Claiming...' : 'Claim Job'}
                    </button>
                  )}

                  {bounty.status === BountyStatus.ASSIGNED && bounty.designer === CURRENT_USER && (
                    <button 
                      onClick={() => handleSubmitWork(bounty)}
                      disabled={!!processingId}
                      className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/50 rounded-lg text-sm font-bold transition-all"
                    >
                       {processingId === bounty.id ? 'Uploading...' : 'Submit Work'}
                    </button>
                  )}

                  {bounty.status === BountyStatus.SUBMITTED && (bounty.client === CURRENT_USER || bounty.client === 'MuskFan_99') && (
                    <button 
                      onClick={() => handleApprove(bounty)}
                      disabled={!!processingId}
                      className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50 rounded-lg text-sm font-bold transition-all"
                    >
                       {processingId === bounty.id ? 'Verifying...' : 'Approve & Pay'}
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