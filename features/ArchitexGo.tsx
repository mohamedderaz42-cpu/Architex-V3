
import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { ServiceRequest, ServiceCategory, ServiceBid, Milestone } from '../types';
import { dalCreateServiceRequest, dalGetActiveServiceRequest, dalAcceptBid, dalCompleteServiceRequest } from '../services/dataAccessLayer';
import { serviceEscrowContract } from '../services/serviceEscrowContract';
import { piService } from '../services/piService';
import { offlineService } from '../services/offlineService';

export const ArchitexGo: React.FC = () => {
    const [activeRequest, setActiveRequest] = useState<ServiceRequest | null>(null);
    const [viewMode, setViewMode] = useState<'SELECT' | 'REQUESTING' | 'ACTIVE'>('SELECT');
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    
    // Form
    const [category, setCategory] = useState<ServiceCategory | null>(null);
    const [desc, setDesc] = useState('');
    const [location, setLocation] = useState('Current Location (Mock)');
    const [loading, setLoading] = useState(false);
    
    // Liability Waiver State
    const [waiverAccepted, setWaiverAccepted] = useState(false);
    
    // Offline State
    const [isOffline, setIsOffline] = useState(!offlineService.isOnline());

    useEffect(() => {
        checkActive();
        const interval = setInterval(checkActive, 3000); // Poll for bids/status
        
        // Listen to network status
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            clearInterval(interval);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const checkActive = async () => {
        const req = await dalGetActiveServiceRequest();
        if (req) {
            setActiveRequest(req);
            setViewMode(req.status === 'BIDDING' ? 'REQUESTING' : 'ACTIVE');
            
            // Check for milestones in contract state
            if (req.status === 'IN_PROGRESS') {
                const ms = serviceEscrowContract.getMilestones(req.id);
                setMilestones(ms);
            }
        } else if (viewMode === 'ACTIVE' || viewMode === 'REQUESTING') {
            // Reset if cancelled/completed externally
            if (activeRequest?.status === 'COMPLETED') return; // Keep showing completion
            setViewMode('SELECT');
            setActiveRequest(null);
        }
    };

    const handleRequest = async () => {
        if (!category || !desc) return;
        if (!waiverAccepted) {
            alert("You must accept the Service Liability Waiver.");
            return;
        }
        if (isOffline) {
            alert("Cannot create new requests while offline. Please reconnect.");
            return;
        }
        setLoading(true);
        const req = await dalCreateServiceRequest(category, desc, location);
        setActiveRequest(req);
        setViewMode('REQUESTING');
        setLoading(false);
    };

    const handleAcceptBid = async (bid: ServiceBid) => {
        if (!activeRequest) return;
        
        // 1. Escrow Payment via Pi SDK
        try {
            await piService.createEscrowPayment(
                `Service Escrow: ${activeRequest.category}`,
                bid.amount,
                {
                    onReadyForServerApproval: async (pid) => console.log("Escrow Approved", pid),
                    onReadyForServerCompletion: async (pid, txid) => {
                        // 2. Lock in Contract
                        await serviceEscrowContract.createEscrow(activeRequest, bid.providerId, bid.amount);
                        // 3. Update Status
                        await dalAcceptBid(activeRequest.id, bid.id);
                        checkActive();
                    },
                    onCancel: () => alert("Payment Cancelled"),
                    onError: (e) => alert("Payment Failed")
                }
            );
        } catch (e) {
            console.error(e);
        }
    };

    const handleReleaseMilestone = async (index: number) => {
        if (!activeRequest) return;
        
        if (isOffline) {
            offlineService.queueAction('RELEASE_MILESTONE', { requestId: activeRequest.id, index });
            alert("Release Queued (Offline Mode). Will sync when online.");
            // Optimistically update local state for UI
            const newMilestones = [...milestones];
            newMilestones[index].status = 'RELEASED';
            setMilestones(newMilestones);
            return;
        }

        try {
            await serviceEscrowContract.releaseMilestone(activeRequest.id, index);
            const ms = serviceEscrowContract.getMilestones(activeRequest.id);
            setMilestones([...ms]); 
            
            const allReleased = ms.every(m => m.status === 'RELEASED');
            if (allReleased) {
                await dalCompleteServiceRequest(activeRequest.id);
                alert("All Milestones Released. Job Completed.");
                setViewMode('SELECT');
            } else {
                alert("Milestone Payment Released.");
            }
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleComplete = async () => {
        if (!activeRequest) return;
        try {
            // If offline, queue
            if (isOffline) {
                offlineService.queueAction('COMPLETE_JOB', { requestId: activeRequest.id });
                alert("Completion Queued. Funds will release when online.");
                setViewMode('SELECT');
                return;
            }

            // Smart Contract Release
            await serviceEscrowContract.releaseFunds(activeRequest.id);
            await dalCompleteServiceRequest(activeRequest.id);
            alert("Job Completed! Funds Released to Provider.");
            setViewMode('SELECT');
            setActiveRequest(null);
            setCategory(null);
            setDesc('');
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleSOS = async () => {
        if (!activeRequest || !confirm("CRITICAL: This will FREEZE funds and open a dispute. Confirm?")) return;
        await serviceEscrowContract.freezeFunds(activeRequest.id);
        alert("SOS Signal Sent. Funds Frozen. Support Team Dispatched.");
    };

    // Radar Visualization Component
    const RadarMap = () => (
        <div className="relative w-full h-64 bg-black/40 rounded-xl overflow-hidden border border-white/10 mb-6">
            <div className="absolute inset-0" style={{ 
                backgroundImage: 'radial-gradient(circle, rgba(0,243,255,0.1) 1px, transparent 1px)', 
                backgroundSize: '20px 20px' 
            }}></div>
            <div className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-r from-transparent to-neon-cyan/10 animate-[spin_4s_linear_infinite] opacity-30 origin-center scale-[2]"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-neon-cyan rounded-full shadow-[0_0_20px_rgba(0,243,255,0.8)] z-10"></div>
            <div className="absolute top-1/3 left-1/3 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-[10px] text-neon-cyan font-mono border border-white/10">
                RADAR: ACTIVE • 5KM RADIUS
            </div>
        </div>
    );

    const CATEGORIES: { id: ServiceCategory, icon: string, label: string }[] = [
        { id: 'PLUMBING', icon: '🔧', label: 'Plumbing' },
        { id: 'ELECTRICAL', icon: '⚡', label: 'Electrical' },
        { id: 'CARPENTRY', icon: '🪚', label: 'Carpentry' },
        { id: 'HVAC', icon: '❄️', label: 'HVAC' },
    ];

    return (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            {/* Offline Banner */}
            {isOffline && (
                <div className="bg-orange-500 text-black text-center font-bold text-xs py-2 rounded animate-pulse shadow-lg shadow-orange-500/20">
                    ⚠️ OFFLINE MODE: Actions will be queued and synced automatically.
                </div>
            )}

            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-display font-bold text-white">Architex Go</h2>
                    <p className="text-gray-400">On-Demand Technician Services.</p>
                </div>
                {viewMode !== 'SELECT' && (
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded border border-green-500/30 animate-pulse">
                        LIVE GIG
                    </span>
                )}
            </div>

            <RadarMap />

            {viewMode === 'SELECT' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <GlassCard title="Select Service">
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setCategory(cat.id)}
                                        className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                                            category === cat.id 
                                            ? 'bg-neon-purple/20 border-neon-purple text-white' 
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                        }`}
                                    >
                                        <span className="text-2xl mb-1">{cat.icon}</span>
                                        <span className="text-xs font-bold">{cat.label}</span>
                                    </button>
                                ))}
                            </div>
                            
                            <textarea 
                                value={desc}
                                onChange={e => setDesc(e.target.value)}
                                placeholder="Describe the issue (e.g., Leaking pipe under sink, urgent)"
                                className="w-full bg-black/40 border border-white/10 rounded p-3 text-white focus:border-neon-purple outline-none h-24 mb-4"
                            />

                            {/* Phase 6.5: Service Liability Waiver */}
                            <div className="bg-red-500/10 border border-red-500/30 rounded p-3 mb-4">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={waiverAccepted}
                                        onChange={e => setWaiverAccepted(e.target.checked)}
                                        className="mt-1 accent-red-500"
                                    />
                                    <span className="text-xs text-gray-300 leading-tight">
                                        <strong className="text-red-400 block mb-1">Service Liability Waiver</strong>
                                        I agree that Architex is a connector venue only. I release Architex from all liability regarding damage, theft, or injury caused by independent providers.
                                    </span>
                                </label>
                            </div>
                            
                            <button 
                                onClick={handleRequest}
                                disabled={!category || !desc || loading || !waiverAccepted}
                                className="w-full py-3 bg-gradient-to-r from-neon-cyan to-blue-600 text-white font-bold rounded-lg hover:shadow-lg disabled:opacity-50 transition-all"
                            >
                                {loading ? 'Broadcasting...' : 'Find Technicians'}
                            </button>
                        </GlassCard>
                    </div>
                    
                    <div>
                        <GlassCard className="h-full flex flex-col justify-center text-center bg-gradient-to-br from-blue-900/10 to-black">
                            <div className="text-4xl mb-2">🛡️</div>
                            <h3 className="font-bold text-white mb-1">Smart Escrow Protection</h3>
                            <p className="text-xs text-gray-400">
                                Funds are locked in a Soroban Contract and only released when you confirm the job is done.
                            </p>
                        </GlassCard>
                    </div>
                </div>
            )}

            {viewMode === 'REQUESTING' && activeRequest && (
                <div className="space-y-4">
                    <GlassCard className="border-neon-purple/50">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">Looking for {activeRequest.category}...</h3>
                            <div className="animate-spin w-5 h-5 border-2 border-neon-purple border-t-transparent rounded-full"></div>
                        </div>
                        <p className="text-sm text-gray-400">
                            Request ID: <span className="font-mono text-neon-cyan">{activeRequest.id}</span>
                        </p>
                    </GlassCard>

                    <h3 className="text-sm font-bold text-gray-400 uppercase">Incoming Bids</h3>
                    {activeRequest.bids.length === 0 ? (
                        <div className="p-8 text-center border border-dashed border-white/10 rounded-xl text-gray-500">
                            Waiting for providers to respond...
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {activeRequest.bids.map(bid => (
                                <GlassCard key={bid.id} className="flex justify-between items-center animate-[slideUp_0.3s_ease-out]">
                                    <div className="flex items-center gap-4">
                                        <img src={bid.providerAvatar} className="w-12 h-12 rounded-full border border-white/20" />
                                        <div>
                                            <h4 className="font-bold text-white">{bid.providerName}</h4>
                                            <div className="text-xs text-yellow-500">★ {bid.providerRating} • {bid.distanceKm}km away</div>
                                            <div className="text-xs text-neon-cyan mt-1">{bid.etaMinutes} min ETA</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-bold text-white mb-2">{bid.amount} Pi</div>
                                        <button 
                                            onClick={() => handleAcceptBid(bid)}
                                            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-bold text-sm shadow-lg transition-all"
                                        >
                                            Accept
                                        </button>
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {viewMode === 'ACTIVE' && activeRequest && (
                <div className="space-y-6">
                    <GlassCard className="border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white">Job In Progress</h2>
                                <p className="text-green-400 text-sm font-bold mt-1">Funds Locked in Escrow</p>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-mono text-white">{activeRequest.finalPrice} Pi</div>
                                <div className="text-xs text-gray-500 uppercase">Agreed Price</div>
                            </div>
                        </div>

                        {/* Milestones View with Visual Progress */}
                        {milestones.length > 0 && (
                            <div className="mb-6 p-4 bg-black/40 rounded-lg border border-white/10">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-sm font-bold text-white">Milestone Release Schedule</h4>
                                    <span className="text-[10px] text-neon-cyan bg-neon-cyan/10 px-2 py-1 rounded border border-neon-cyan/20">
                                        High Value Contract
                                    </span>
                                </div>
                                
                                {/* Progress Bar */}
                                <div className="flex w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
                                    {milestones.map((m, i) => (
                                        <div 
                                            key={i} 
                                            className={`h-full transition-all ${m.status === 'RELEASED' ? 'bg-green-500' : 'bg-gray-600'}`} 
                                            style={{ width: `${m.percentage}%`, borderRight: '1px solid black' }}
                                        ></div>
                                    ))}
                                </div>

                                <div className="space-y-2">
                                    {milestones.map((m, idx) => (
                                        <div key={m.id} className={`flex justify-between items-center p-3 rounded transition-colors ${m.status === 'RELEASED' ? 'bg-green-500/10 border border-green-500/30' : 'bg-white/5 border border-white/5'}`}>
                                            <div>
                                                <div className="text-xs font-bold text-white">{m.name} ({m.percentage}%)</div>
                                                <div className="font-mono text-xs text-gray-400">{m.amount} Pi</div>
                                            </div>
                                            {m.status === 'RELEASED' ? (
                                                <div className="flex items-center gap-1 text-xs text-green-400 font-bold">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                                                    RELEASED
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => handleReleaseMilestone(idx)}
                                                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-bold shadow hover:shadow-green-500/20 transition-all"
                                                >
                                                    Release Funds
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button 
                                onClick={handleSOS}
                                className="px-4 py-4 bg-red-600/20 border border-red-600 text-red-500 font-bold rounded-lg hover:bg-red-600/30 transition-all"
                            >
                                SOS / Dispute
                            </button>
                            
                            {milestones.length === 0 && (
                                <button 
                                    onClick={handleComplete}
                                    className="flex-1 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    Mark Complete & Release
                                </button>
                            )}
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};
