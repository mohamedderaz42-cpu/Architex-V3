

import React, { useEffect, useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { dalGetUserDesigns, dalUnlockDesign, dalInitializeConversation } from '../services/dataAccessLayer';
import { piService } from '../services/piService';
import { DesignAsset } from '../types';
import { ProactiveIntervention } from '../components/ProactiveIntervention';

interface BlueprintStoreProps {
    onOpenChat?: (contextId: string) => void;
}

export const BlueprintStore: React.FC<BlueprintStoreProps> = ({ onOpenChat }) => {
  const [designs, setDesigns] = useState<DesignAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Proactive UX State
  const [modificationCount, setModificationCount] = useState(0);
  const [showIntervention, setShowIntervention] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState<string | null>(null);

  // Visualization State
  const [vizMode, setVizMode] = useState<Record<string, 'DAY' | 'NIGHT'>>({});

  useEffect(() => {
    loadDesigns();
  }, []);

  const loadDesigns = async () => {
    setLoading(true);
    const data = await dalGetUserDesigns();
    setDesigns(data);
    
    // Initialize Viz Modes based on simple local time logic for mock geolocations
    const initialViz: Record<string, 'DAY' | 'NIGHT'> = {};
    data.forEach(d => {
        initialViz[d.id] = 'DAY'; 
        // In a real app, we'd check d.geolocation vs Date.now()
    });
    setVizMode(initialViz);

    setLoading(false);
  };

  const toggleDayNight = (id: string) => {
      setVizMode(prev => ({
          ...prev,
          [id]: prev[id] === 'DAY' ? 'NIGHT' : 'DAY'
      }));
  };

  const handleShare = async (design: DesignAsset) => {
      const text = `Check out this amazing design on Architex: ${design.title}. Built on Pi Network.`;
      await piService.shareToPiSocial(text, design.thumbnailUrl);
  };

  const handleUnlock = async (design: DesignAsset) => {
    setProcessingId(design.id);
    try {
      // Use createTreasuryPayment to route the 0.50 Pi generation fee directly to the Multi-Sig Treasury
      await piService.createTreasuryPayment(
        `Generation Fee: ${design.title}`,
        design.price, // 0.50 Pi
        {
          onReadyForServerApproval: async (paymentId) => {
            console.log("Service Fee Approved by User, routing to Treasury...", paymentId);
          },
          onReadyForServerCompletion: async (paymentId, txid) => {
             const unlockedDesign = await dalUnlockDesign(paymentId, design.id);
             if (unlockedDesign) {
                 setDesigns(prev => prev.map(d => d.id === design.id ? unlockedDesign : d));
                 alert(`Success! Fee routed to Treasury. ${design.format} file unlocked.`);
             }
          },
          onCancel: (paymentId) => {
            setProcessingId(null);
          },
          onError: (error, payment) => {
            setProcessingId(null);
            alert("Transaction Failed on Pi Blockchain.");
          }
        }
      );
    } catch (e) {
      console.error(e);
      setProcessingId(null);
    } finally {
        setProcessingId(null);
    }
  };

  const handleDownload = (design: DesignAsset) => {
      if (design.highResUrl) {
          window.open(design.highResUrl, '_blank');
      }
  };

  const handleContextualChat = async (design: DesignAsset) => {
      const contextId = await dalInitializeConversation(design);
      if (onOpenChat) {
          onOpenChat(contextId);
      }
  };

  // --- Proactive UX Logic ---
  const handleCustomize = (design: DesignAsset) => {
    // 1. Check Rule
    if (modificationCount >= 2) {
        setShowIntervention(true);
        return;
    }

    // 2. Simulate Manual Modification
    setIsCustomizing(design.id);
    setTimeout(() => {
        setModificationCount(prev => prev + 1);
        setIsCustomizing(null);
        // Toast could go here in a full implementation
    }, 1500);
  };

  const handleHireProfessional = () => {
      setShowIntervention(false);
      // Reset count to avoid looping immediately if they return
      setModificationCount(0);
      
      // Redirect to support chat (assuming the first unlocked design or a generic context)
      // In a real scenario, we'd pass the specific design ID causing the friction.
      const targetDesign = designs.find(d => d.status === 'UNLOCKED');
      if (targetDesign) {
          handleContextualChat(targetDesign);
      } else {
          // Fallback if no specific design is readily available contextually
          alert("Redirecting to Professional Services Directory...");
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-display font-bold">Blueprint Studio</h2>
        <div className="text-xs font-mono text-neon-cyan border border-neon-cyan/30 px-3 py-1 rounded-full">
            STORE CONNECTED: PI NETWORK
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1,2,3].map(i => <div key={i} className="h-64 bg-white/5 rounded-xl"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {designs.map(design => {
            const isNight = vizMode[design.id] === 'NIGHT';
            return (
                <GlassCard key={design.id} className="group relative !p-0 overflow-hidden flex flex-col h-full">
                {/* Preview Area */}
                <div className="relative h-48 overflow-hidden bg-black/50 transition-all duration-1000">
                    
                    {/* Day/Night Filter Overlay */}
                    <div className={`absolute inset-0 z-10 pointer-events-none transition-colors duration-1000 ${isNight ? 'bg-blue-900/40 mix-blend-multiply' : 'bg-transparent'}`}></div>
                    
                    <img 
                        src={design.thumbnailUrl} 
                        alt={design.title} 
                        className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${design.status === 'LOCKED' ? 'grayscale-[50%] blur-[1px]' : ''} ${isNight ? 'brightness-75 contrast-125' : ''}`}
                    />
                    
                    {design.status === 'LOCKED' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 pointer-events-none select-none z-20">
                            <div className="rotate-[-15deg] border-4 border-white/20 px-4 py-2">
                                <span className="text-3xl font-black text-white/20 uppercase tracking-widest whitespace-nowrap">PREVIEW ONLY</span>
                            </div>
                        </div>
                    )}
                    
                    {/* Visualizer Controls */}
                    <div className="absolute top-2 left-2 z-30">
                        <button 
                            onClick={(e) => { e.stopPropagation(); toggleDayNight(design.id); }}
                            className="bg-black/50 backdrop-blur rounded-full p-1.5 text-white hover:bg-black/70 border border-white/20"
                            title="Toggle Day/Night Cycle"
                        >
                            {isNight ? (
                                <span className="text-xs">🌙</span>
                            ) : (
                                <span className="text-xs">☀️</span>
                            )}
                        </button>
                    </div>

                    <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur rounded text-xs font-bold text-white border border-white/10 z-20">
                        {design.format}
                    </div>
                </div>

                {/* Action Area */}
                <div className="p-5 flex-1 flex flex-col justify-between bg-gradient-to-b from-transparent to-black/40">
                    <div>
                        <div className="flex justify-between items-start mb-1">
                            <h3 className="text-lg font-bold text-white truncate pr-2">{design.title}</h3>
                            <button 
                                onClick={() => handleShare(design)}
                                className="text-gray-400 hover:text-neon-cyan transition-colors"
                                title="Share to Pi Network"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 font-mono mb-2">
                            Generated: {new Date(design.timestamp).toLocaleDateString()}
                        </p>
                        {design.geolocation && (
                            <p className="text-[10px] text-gray-500 mb-4 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                {design.geolocation.lat.toFixed(2)}, {design.geolocation.lng.toFixed(2)}
                            </p>
                        )}
                    </div>

                    <div className="mt-auto space-y-3">
                        {design.status === 'LOCKED' ? (
                            <div>
                                <div className="flex justify-between items-end mb-3">
                                    <span className="text-xs text-neon-pink">Image Gen Fee</span>
                                    <span className="text-xl font-bold text-neon-cyan">{design.price.toFixed(2)} Pi</span>
                                </div>
                                <button 
                                    onClick={() => handleUnlock(design)}
                                    disabled={!!processingId}
                                    className="w-full py-2 bg-gradient-to-r from-neon-purple to-pink-600 rounded-lg font-bold text-white text-sm hover:shadow-[0_0_15px_rgba(188,19,254,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {processingId === design.id ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            <span>Routing Fee...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                            <span>Pay Gen Fee (Treasury)</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-xs text-green-400">License Acquired</span>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleCustomize(design)}
                                        disabled={isCustomizing === design.id}
                                        className="flex-1 py-2 bg-white/5 border border-white/20 text-white rounded-lg font-bold text-xs hover:bg-white/10 transition-all flex items-center justify-center gap-1"
                                    >
                                        {isCustomizing === design.id ? (
                                            <span className="animate-pulse">Saving...</span>
                                        ) : (
                                            <>
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                Customize
                                            </>
                                        )}
                                    </button>
                                    <button 
                                        onClick={() => handleDownload(design)}
                                        className="px-3 py-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg font-bold text-xs hover:bg-green-500/20 transition-all"
                                        title="Download"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        <button 
                            onClick={() => handleContextualChat(design)}
                            className="w-full py-2 bg-transparent border border-white/20 text-gray-300 rounded-lg font-medium text-xs hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                            {design.status === 'LOCKED' ? 'Inquire about Pricing' : 'Design Support'}
                        </button>
                    </div>
                </div>
                </GlassCard>
            );
          })}
        </div>
      )}

      {/* Proactive Engine Intervention */}
      <ProactiveIntervention 
        isOpen={showIntervention}
        onClose={() => setShowIntervention(false)}
        onConfirm={handleHireProfessional}
      />
    </div>
  );
};