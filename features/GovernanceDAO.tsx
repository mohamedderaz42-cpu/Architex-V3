
import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { governanceContract } from '../services/governanceContract';
import { UserSession, GovernanceProposal } from '../types';

interface GovernanceDAOProps {
    session: UserSession;
}

export const GovernanceDAO: React.FC<GovernanceDAOProps> = ({ session }) => {
    const [proposals, setProposals] = useState<GovernanceProposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'VOTE' | 'CREATE' | 'CONSTITUTION'>('VOTE');
    
    // Create Form
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const CONSTANTS = governanceContract.getConstants();

    useEffect(() => {
        loadProposals();
    }, []);

    const loadProposals = async () => {
        setLoading(true);
        const data = await governanceContract.getAllProposals();
        setProposals(data);
        setLoading(false);
    };

    const handleCreate = async () => {
        if (!title || !description) return;
        setIsCreating(true);
        try {
            await governanceContract.createProposal(
                title, 
                description, 
                session.votingPower || 0, 
                session.username
            );
            alert("Proposal Created Successfully!");
            setTitle('');
            setDescription('');
            setActiveTab('VOTE');
            loadProposals();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleVote = async (proposalId: string, support: boolean) => {
        try {
            await governanceContract.castVote(
                proposalId, 
                session.username, 
                support, 
                session.votingPower || 0
            );
            alert("Vote Cast!");
            loadProposals();
        } catch (e: any) {
            alert(e.message);
        }
    };

    return (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-display font-bold text-white">Architex DAO</h2>
                    <p className="text-gray-400">Decentralized Governance & Trust Network</p>
                </div>
                <div className="text-right">
                    <div className="text-xs text-gray-500 uppercase">My Voting Power</div>
                    <div className="text-2xl font-mono font-bold text-neon-purple">
                        {(session.votingPower || 0).toLocaleString()} VP
                    </div>
                </div>
            </div>

            {/* Trust Score Card */}
            <GlassCard className="bg-gradient-to-br from-blue-900/20 to-black border-blue-500/30">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="relative w-32 h-32 flex-shrink-0">
                         {/* Circle Graph */}
                         <svg className="w-full h-full transform -rotate-90">
                            <circle cx="64" cy="64" r="60" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="transparent" />
                            <circle 
                                cx="64" cy="64" r="60" stroke="#00f3ff" strokeWidth="8" fill="transparent" 
                                strokeDasharray={377}
                                strokeDashoffset={377 - (377 * (session.trustProfile?.score || 0) / 100)}
                                className="transition-all duration-1000"
                            />
                         </svg>
                         <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-white">{session.trustProfile?.score || 0}</span>
                            <span className="text-[8px] uppercase tracking-widest text-neon-cyan">Trust Score</span>
                         </div>
                    </div>
                    
                    <div className="flex-1 w-full">
                        <div className="flex justify-between items-end mb-4 border-b border-white/10 pb-2">
                             <div>
                                 <h3 className="font-bold text-white text-lg">{session.trustProfile?.level} Level</h3>
                                 <p className="text-xs text-gray-400">Higher trust increases your Voting Power multiplier.</p>
                             </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Financial', val: session.trustProfile?.components.financial },
                                { label: 'Reputation', val: session.trustProfile?.components.reputation },
                                { label: 'History', val: session.trustProfile?.components.history },
                                { label: 'Legal', val: session.trustProfile?.components.legal },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white/5 rounded p-2 text-center">
                                    <div className="text-lg font-bold text-white">{stat.val}</div>
                                    <div className="text-[10px] text-gray-500 uppercase">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Tabs */}
            <div className="flex bg-white/5 rounded-lg p-1 border border-white/10 w-fit">
                <button onClick={() => setActiveTab('VOTE')} className={`px-4 py-2 rounded text-sm font-bold transition-all ${activeTab === 'VOTE' ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-gray-400'}`}>Proposals</button>
                <button onClick={() => setActiveTab('CREATE')} className={`px-4 py-2 rounded text-sm font-bold transition-all ${activeTab === 'CREATE' ? 'bg-neon-purple/20 text-neon-purple' : 'text-gray-400'}`}>Create Proposal</button>
                <button onClick={() => setActiveTab('CONSTITUTION')} className={`px-4 py-2 rounded text-sm font-bold transition-all ${activeTab === 'CONSTITUTION' ? 'bg-white/10 text-white' : 'text-gray-400'}`}>Constitution</button>
            </div>

            {/* Content Area */}
            {activeTab === 'VOTE' && (
                <div className="space-y-4">
                     {proposals.map(p => {
                         const total = p.votesFor + p.votesAgainst;
                         const forPct = total > 0 ? (p.votesFor / total) * 100 : 0;
                         const againstPct = total > 0 ? (p.votesAgainst / total) * 100 : 0;
                         const isActive = p.status === 'ACTIVE';

                         return (
                             <GlassCard key={p.id} className="relative overflow-hidden group">
                                 <div className="flex justify-between items-start mb-2">
                                     <h3 className="text-xl font-bold text-white group-hover:text-neon-cyan transition-colors">{p.title}</h3>
                                     <span className={`px-2 py-0.5 text-[10px] rounded border font-bold ${isActive ? 'bg-green-500/20 border-green-500 text-green-400 animate-pulse' : 'bg-gray-500/20 border-gray-500 text-gray-400'}`}>
                                         {p.status}
                                     </span>
                                 </div>
                                 <p className="text-gray-400 text-sm mb-4">{p.description}</p>
                                 
                                 <div className="bg-black/40 rounded-lg p-3 border border-white/5 mb-4">
                                     <div className="flex justify-between text-xs mb-1">
                                         <span className="text-green-400">YES: {p.votesFor.toLocaleString()} VP</span>
                                         <span className="text-red-400">NO: {p.votesAgainst.toLocaleString()} VP</span>
                                     </div>
                                     <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden flex">
                                         <div className="bg-green-500 h-full" style={{ width: `${forPct}%` }}></div>
                                         <div className="bg-red-500 h-full" style={{ width: `${againstPct}%` }}></div>
                                     </div>
                                 </div>

                                 <div className="flex justify-between items-center">
                                     <div className="text-xs text-gray-500">
                                         Quorum Reached: <span className={p.quorumReached ? 'text-green-400' : 'text-orange-400'}>{p.quorumReached ? 'YES' : 'NO'}</span>
                                     </div>
                                     {isActive && (
                                         <div className="flex gap-2">
                                             <button onClick={() => handleVote(p.id, false)} className="px-4 py-2 border border-red-500/50 text-red-400 rounded hover:bg-red-500/20 text-xs font-bold">Reject</button>
                                             <button onClick={() => handleVote(p.id, true)} className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded hover:bg-green-500/30 text-xs font-bold">Support</button>
                                         </div>
                                     )}
                                 </div>
                             </GlassCard>
                         );
                     })}
                </div>
            )}

            {activeTab === 'CREATE' && (
                <GlassCard className="max-w-2xl mx-auto">
                    <h3 className="text-xl font-bold text-white mb-4">Draft Governance Proposal</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Title</label>
                            <input 
                                value={title} onChange={e => setTitle(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded p-3 text-white focus:border-neon-purple outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Description & Execution Plan</label>
                            <textarea 
                                value={description} onChange={e => setDescription(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded p-3 text-white focus:border-neon-purple outline-none h-32"
                            />
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded text-xs text-yellow-200">
                            Minimum Voting Power Required: {CONSTANTS.MIN_PROPOSAL_POWER.toLocaleString()} VP
                        </div>
                        <button 
                            onClick={handleCreate}
                            disabled={isCreating}
                            className="w-full py-3 bg-neon-purple text-white font-bold rounded hover:bg-neon-purple/80 disabled:opacity-50"
                        >
                            {isCreating ? 'Publishing...' : 'Submit Proposal'}
                        </button>
                    </div>
                </GlassCard>
            )}

            {activeTab === 'CONSTITUTION' && (
                <GlassCard>
                    <div className="prose prose-invert max-w-none">
                        <h3 className="text-2xl font-bold text-white mb-4">ArchitexDAO Governance Constitution</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="text-neon-cyan font-bold mb-2">1. Voting Power Calculation</h4>
                                <div className="bg-black/30 p-4 rounded border border-white/10 font-mono text-sm text-gray-300">
                                    VP = Staked_ARTX + (Trust_Score * 10)
                                </div>
                                <p className="text-sm text-gray-400 mt-2">
                                    Power is derived not just from capital (Staked ARTX), but from community trust. A high Trust Score significantly boosts your governance influence.
                                </p>
                            </div>

                            <div>
                                <h4 className="text-neon-cyan font-bold mb-2">2. Quorum Requirements</h4>
                                <div className="bg-black/30 p-4 rounded border border-white/10 font-mono text-sm text-gray-300">
                                    Quorum = {(CONSTANTS.QUORUM_PERCENTAGE * 100)}% of Network Power
                                </div>
                                <p className="text-sm text-gray-400 mt-2">
                                    For a proposal to be valid, at least 30% of the network's active voting power must participate in the vote.
                                </p>
                            </div>

                            <div>
                                <h4 className="text-neon-cyan font-bold mb-2">3. Passing Threshold</h4>
                                <div className="bg-black/30 p-4 rounded border border-white/10 font-mono text-sm text-gray-300">
                                    Pass > {(CONSTANTS.PASS_THRESHOLD * 100)}% YES Votes
                                </div>
                                <p className="text-sm text-gray-400 mt-2">
                                    A simple majority is required for standard proposals. Constitutional amendments may require a supermajority (66%).
                                </p>
                            </div>

                            <div>
                                <h4 className="text-neon-cyan font-bold mb-2">4. Smart Contract Execution</h4>
                                <p className="text-sm text-gray-400">
                                    Proposals are encoded in Soroban smart contracts. Upon passing and meeting quorum, the logic (e.g., Treasury transfer, Parameter update) is automatically executed by the protocol.
                                </p>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            )}
        </div>
    );
};
