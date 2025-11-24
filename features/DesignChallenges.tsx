import React, { useEffect, useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { dalGetActiveChallenges, dalSubmitToChallenge, dalGetUserDesigns } from '../services/dataAccessLayer';
import { DesignChallenge, DesignAsset } from '../types';

export const DesignChallenges: React.FC = () => {
    const [challenges, setChallenges] = useState<DesignChallenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChallenge, setSelectedChallenge] = useState<DesignChallenge | null>(null);
    
    // Submission State
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [myDesigns, setMyDesigns] = useState<DesignAsset[]>([]);
    const [selectedDesignId, setSelectedDesignId] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const data = await dalGetActiveChallenges();
        setChallenges(data);
        setLoading(false);
    };

    const handleSelectChallenge = (c: DesignChallenge) => {
        setSelectedChallenge(c);
        if (c.status === 'ACTIVE') {
            fetchMyDesigns();
        }
    };

    const fetchMyDesigns = async () => {
        const designs = await dalGetUserDesigns();
        // Filter for unlocked/completed designs
        setMyDesigns(designs.filter(d => d.status === 'UNLOCKED' || d.status === 'MINTED'));
    };

    const handleSubmitEntry = async () => {
        if (!selectedChallenge || !selectedDesignId) return;
        setSubmitting(true);
        const success = await dalSubmitToChallenge(selectedChallenge.id, selectedDesignId);
        if (success) {
            alert("Design submitted successfully! Good luck.");
            setShowSubmitModal(false);
            loadData(); // Refresh counts
        } else {
            alert("Submission failed.");
        }
        setSubmitting(false);
    };

    const getTimeLeft = (deadline: number) => {
        const diff = deadline - Date.now();
        if (diff <= 0) return "Ended";
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        return `${days} Days Left`;
    };

    return (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-display font-bold text-white">Design Challenges</h2>
                    <p className="text-gray-400">DAO-Sponsored Competitions with ARTX Rewards.</p>
                </div>
                {selectedChallenge && (
                    <button 
                        onClick={() => { setSelectedChallenge(null); setShowSubmitModal(false); }}
                        className="text-sm text-gray-400 hover:text-white"
                    >
                        Back to List
                    </button>
                )}
            </div>

            {!selectedChallenge ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {challenges.map(c => (
                        <GlassCard 
                            key={c.id} 
                            className="group !p-0 overflow-hidden cursor-pointer hover:border-neon-purple/50 transition-all"
                            onClick={() => handleSelectChallenge(c)}
                        >
                            <div className="h-40 relative">
                                <img src={c.thumbnailUrl} className="w-full h-full object-cover" alt="Challenge" />
                                <div className="absolute inset-0 bg-black/50 hover:bg-black/30 transition-colors flex items-center justify-center">
                                    <div className="bg-black/80 backdrop-blur px-3 py-1 rounded-full text-neon-purple font-bold text-sm border border-neon-purple/50">
                                        {c.rewardARTX.toLocaleString()} ARTX Prize
                                    </div>
                                </div>
                                <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 rounded text-[10px] text-white font-bold">
                                    {c.status}
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">{c.sponsorDAO} Presents</div>
                                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-neon-cyan transition-colors">{c.title}</h3>
                                <p className="text-sm text-gray-400 line-clamp-2 mb-4">{c.description}</p>
                                
                                <div className="flex justify-between items-center text-xs text-gray-300 border-t border-white/10 pt-3">
                                    <span>{c.participants} Entries</span>
                                    <span className="text-neon-pink font-bold">{getTimeLeft(c.deadline)}</span>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="relative h-64 rounded-xl overflow-hidden">
                            <img src={selectedChallenge.thumbnailUrl} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                            <div className="absolute bottom-0 left-0 p-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-neon-purple text-white px-3 py-1 rounded text-xs font-bold shadow-lg shadow-neon-purple/50">
                                        {selectedChallenge.rewardARTX.toLocaleString()} ARTX Pool
                                    </span>
                                    <span className="bg-black/60 text-gray-300 px-3 py-1 rounded text-xs border border-white/10">
                                        {selectedChallenge.status}
                                    </span>
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-2">{selectedChallenge.title}</h2>
                                <p className="text-gray-300 max-w-xl">{selectedChallenge.description}</p>
                            </div>
                        </div>

                        <GlassCard title="Requirements">
                            <ul className="list-disc list-inside space-y-2 text-sm text-gray-300">
                                {selectedChallenge.requirements.map((req, i) => (
                                    <li key={i}>{req}</li>
                                ))}
                            </ul>
                        </GlassCard>
                    </div>

                    <div className="space-y-6">
                        <GlassCard className="text-center">
                            <h4 className="text-gray-400 text-xs font-bold uppercase mb-2">Sponsor</h4>
                            <div className="text-xl font-bold text-white mb-4">{selectedChallenge.sponsorDAO}</div>
                            <div className="flex justify-between text-xs text-gray-500 mb-6 px-4">
                                <div className="text-center">
                                    <div className="text-white font-bold">{selectedChallenge.participants}</div>
                                    <div>Entries</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-neon-pink font-bold">{getTimeLeft(selectedChallenge.deadline)}</div>
                                    <div>Time Left</div>
                                </div>
                            </div>
                            
                            {selectedChallenge.status === 'ACTIVE' ? (
                                <button 
                                    onClick={() => setShowSubmitModal(true)}
                                    className="w-full py-3 bg-gradient-to-r from-neon-purple to-pink-600 rounded-lg font-bold text-white shadow-lg transition-transform hover:scale-105"
                                >
                                    Submit Design
                                </button>
                            ) : (
                                <button disabled className="w-full py-3 bg-white/5 border border-white/10 rounded-lg text-gray-500 cursor-not-allowed">
                                    Submissions Closed
                                </button>
                            )}
                        </GlassCard>
                    </div>
                </div>
            )}

            {/* Submission Modal */}
            {showSubmitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <GlassCard className="max-w-md w-full border-neon-purple/50">
                        <h3 className="text-xl font-bold text-white mb-4">Submit Entry</h3>
                        <p className="text-sm text-gray-400 mb-4">Select an unlocked design from your portfolio to submit to this challenge.</p>
                        
                        <div className="max-h-60 overflow-y-auto space-y-2 mb-6 pr-2">
                            {myDesigns.length === 0 ? (
                                <div className="text-center py-4 text-gray-500 text-sm border border-dashed border-white/10 rounded">
                                    No eligible designs found. Unlock or create a design first.
                                </div>
                            ) : (
                                myDesigns.map(d => (
                                    <div 
                                        key={d.id}
                                        onClick={() => setSelectedDesignId(d.id)}
                                        className={`p-3 rounded border cursor-pointer flex items-center gap-3 transition-colors ${
                                            selectedDesignId === d.id 
                                            ? 'bg-neon-purple/20 border-neon-purple' 
                                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                                        }`}
                                    >
                                        <img src={d.thumbnailUrl} className="w-10 h-10 rounded object-cover" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-white text-sm truncate">{d.title}</div>
                                            <div className="text-[10px] text-gray-500">{d.format}</div>
                                        </div>
                                        {selectedDesignId === d.id && (
                                            <div className="w-4 h-4 rounded-full bg-neon-purple flex items-center justify-center text-[10px]">✓</div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowSubmitModal(false)}
                                className="flex-1 py-2 border border-white/20 rounded text-gray-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSubmitEntry}
                                disabled={!selectedDesignId || submitting}
                                className="flex-1 py-2 bg-neon-purple text-white rounded font-bold hover:bg-neon-purple/80 disabled:opacity-50"
                            >
                                {submitting ? 'Submitting...' : 'Confirm Entry'}
                            </button>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};