
import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { dalGetDisputes, dalGetArbitrators, dalGetDisputeById, dalUpdateDispute } from '../services/dataAccessLayer';
import { bountySmartContract } from '../services/bountySmartContract';
import { conflictResolutionService } from '../services/conflictResolutionService';
import { Dispute, ArbitratorProfile } from '../types';

export const DisputeConsole: React.FC = () => {
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Flow State
    const [viewMode, setViewMode] = useState<'LIST' | 'DETAIL'>('LIST');
    const [archieThinking, setArchieThinking] = useState(false);
    const [arbitratorFound, setArbitratorFound] = useState<ArbitratorProfile | null>(null);

    // Arbitrator Ruling Inputs
    const [splitPct, setSplitPct] = useState(50);

    const CURRENT_USER = 'PiUser_Alpha'; // Mock

    useEffect(() => {
        loadDisputes();
    }, []);

    const loadDisputes = async () => {
        setLoading(true);
        const data = await dalGetDisputes(CURRENT_USER);
        setDisputes(data);
        setLoading(false);
    };

    const handleSelectDispute = async (dispute: Dispute) => {
        setSelectedDispute(dispute);
        setViewMode('DETAIL');
        
        // If Open and no arbitrator, trigger ArchieBot matching
        if (dispute.status === 'OPEN' && !dispute.arbitratorId) {
            runArbitratorMatching(dispute);
        }
    };

    const runArbitratorMatching = async (dispute: Dispute) => {
        setArchieThinking(true);
        setTimeout(async () => {
            const allArbs = await dalGetArbitrators();
            const eligible = conflictResolutionService.findEligibleArbitrators(dispute, allArbs);
            
            if (eligible.length > 0) {
                const bestMatch = eligible[0];
                setArbitratorFound(bestMatch);
                
                // Auto-assign in mock
                dispute.arbitratorId = bestMatch.id;
                dispute.status = 'ARBITRATION';
                await dalUpdateDispute(dispute);
                setSelectedDispute({...dispute});
            }
            setArchieThinking(false);
        }, 2000);
    };

    const handleRuling = async () => {
        if (!selectedDispute || !arbitratorFound) return;
        
        // In real app, only Arbitrator can call this
        try {
            await bountySmartContract.resolveDispute(
                selectedDispute.id,
                selectedDispute.initiator, // Winner (Simulated)
                splitPct
            );
            alert("Ruling Executed on Smart Contract");
            setViewMode('LIST');
            loadDisputes();
        } catch (e: any) {
            alert(e.message);
        }
    };

    return (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-display font-bold text-white">Dispute Resolution Center</h2>
                    <p className="text-gray-400">Decentralized Arbitration Marketplace.</p>
                </div>
                {viewMode === 'DETAIL' && (
                    <button onClick={() => setViewMode('LIST')} className="text-sm text-gray-400 hover:text-white">
                        Back to List
                    </button>
                )}
            </div>

            {viewMode === 'LIST' && (
                <div className="grid grid-cols-1 gap-4">
                    {disputes.length === 0 ? (
                        <div className="p-10 border border-dashed border-white/10 rounded-xl text-center text-gray-500">
                            No active disputes.
                        </div>
                    ) : (
                        disputes.map(disp => (
                            <GlassCard 
                                key={disp.id} 
                                className="cursor-pointer hover:border-red-500/50 transition-all border-red-500/20"
                                onClick={() => handleSelectDispute(disp)}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30">
                                                {disp.status}
                                            </span>
                                            <span className="text-gray-400 text-xs">ID: {disp.id}</span>
                                        </div>
                                        <h3 className="font-bold text-white">{disp.reason}</h3>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {disp.initiator} vs {disp.respondent}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <button className="px-4 py-2 bg-white/5 border border-white/10 rounded text-sm hover:bg-white/10">
                                            View Case
                                        </button>
                                    </div>
                                </div>
                            </GlassCard>
                        ))
                    )}
                </div>
            )}

            {viewMode === 'DETAIL' && selectedDispute && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Case Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <GlassCard title="Case Details">
                            <div className="p-4 bg-white/5 rounded-lg border border-white/10 mb-4">
                                <h4 className="font-bold text-white mb-2">{selectedDispute.reason}</h4>
                                <div className="text-sm text-gray-400">
                                    A dispute was raised regarding Contract <span className="text-neon-cyan font-mono">{selectedDispute.bountyId}</span>.
                                    The Initiator claims breach of contract terms.
                                </div>
                            </div>
                            
                            <h4 className="text-xs uppercase font-bold text-gray-500 mb-2">Evidence Log</h4>
                            <div className="space-y-3">
                                {selectedDispute.evidence.map((ev, i) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">
                                            {ev.submittedBy.substring(0,2)}
                                        </div>
                                        <div className="bg-black/30 p-3 rounded-lg border border-white/5 flex-1">
                                            <div className="text-xs text-gray-500 mb-1">{new Date(ev.timestamp).toLocaleString()}</div>
                                            <p className="text-sm text-gray-300">{ev.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    </div>

                    {/* Right: Arbitration Process */}
                    <div className="space-y-6">
                        {/* ArchieBot Status */}
                        <GlassCard className={`border-l-4 ${archieThinking ? 'border-neon-purple animate-pulse' : 'border-neon-cyan'}`}>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center border border-white/20">
                                    🤖
                                </div>
                                <div className="font-bold text-white">ArchieBot Protocol</div>
                            </div>
                            {archieThinking ? (
                                <div className="text-sm text-neon-purple">
                                    Analyzing communication logs... <br/>
                                    Checking Conflict of Interest Graph...
                                </div>
                            ) : arbitratorFound ? (
                                <div>
                                    <div className="text-sm text-green-400 mb-2">Arbitrator Assigned.</div>
                                    <div className="flex items-center gap-2 p-2 bg-white/5 rounded">
                                        <span className="text-xl">⚖️</span>
                                        <div>
                                            <div className="font-bold text-white text-sm">{arbitratorFound.displayName}</div>
                                            <div className="text-[10px] text-gray-400">Reputation: {arbitratorFound.reputationScore}</div>
                                        </div>
                                    </div>
                                    <div className="mt-2 text-[10px] text-gray-500">
                                        COI Check Passed. Neutrality Verified.
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-400">Waiting for assignment...</div>
                            )}
                        </GlassCard>

                        {/* Arbitrator Tools (Mocked for Demo) */}
                        {arbitratorFound && selectedDispute.status === 'ARBITRATION' && (
                            <GlassCard title="Arbitrator Console" className="border-red-500/30">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase font-bold">Ruling: Split Funds</label>
                                        <input 
                                            type="range" min="0" max="100" 
                                            value={splitPct} onChange={(e) => setSplitPct(parseInt(e.target.value))}
                                            className="w-full mt-2"
                                        />
                                        <div className="flex justify-between text-xs mt-1 font-bold">
                                            <span className="text-blue-400">Initiator: {splitPct}%</span>
                                            <span className="text-orange-400">Respondent: {100 - splitPct}%</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleRuling}
                                        className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded shadow-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
                                        Execute Final Ruling
                                    </button>
                                </div>
                            </GlassCard>
                        )}
                        
                        {selectedDispute.status === 'RESOLVED' && (
                            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-center">
                                <h3 className="text-green-400 font-bold mb-1">Case Closed</h3>
                                <p className="text-xs text-gray-400">Funds distributed per Smart Contract.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
