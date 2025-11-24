
import React, { useEffect, useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { dalGetUserDesigns, dalUnlockDesign, dalInitializeConversation } from '../services/dataAccessLayer';
import { piService } from '../services/piService';
import { DesignAsset } from '../types';
import { PAYMENT_CONFIG, UI_CONSTANTS } from '../constants';

interface BlueprintStoreProps {
    onOpenChat?: (contextId: string) => void;
}

export const BlueprintStore: React.FC<BlueprintStoreProps> = ({ onOpenChat }) => {
  const [designs, setDesigns] = useState<DesignAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadDesigns();
  }, []);

  const loadDesigns = async () => {
    setLoading(true);
    const data = await dalGetUserDesigns();
    setDesigns(data);
    setLoading(false);
  };

  const handleUnlock = async (design: DesignAsset) => {
    setProcessingId(design.id);
    
    try {
      await piService.createPayment(
        `Unlock: ${design.title}`,
        design.price,
        {
          onReadyForServerApproval: async (paymentId) => {
            console.log("Payment Approved by User, sending to backend...", paymentId);
            // In a real app, you would POST to your backend here to 'approve' the payment with Pi Servers
          },
          onReadyForServerCompletion: async (paymentId, txid) => {
             console.log("Blockchain Transaction Confirmed:", txid);
             // Verify and Unlock
             const unlockedDesign = await dalUnlockDesign(paymentId, design.id);
             if (unlockedDesign) {
                 setDesigns(prev => prev.map(d => d.id === design.id ? unlockedDesign : d));
                 alert(`Success! ${design.format} file unlocked.`);
             }
          },
          onCancel: (paymentId) => {
            console.log("Payment Cancelled", paymentId);
            setProcessingId(null);
          },
          onError: (error, payment) => {
            console.error("Payment Error", error);
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
          {designs.map(design => (
            <GlassCard key={design.id} className="group relative !p-0 overflow-hidden flex flex-col h-full">
              {/* Preview Area */}
              <div className="relative h-48 overflow-hidden bg-black/50">
                <img 
                    src={design.thumbnailUrl} 
                    alt={design.title} 
                    className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${design.status === 'LOCKED' ? 'grayscale-[50%] blur-[1px]' : ''}`}
                />
                
                {/* Protocol: Watermark Overlay (If Locked) */}
                {design.status === 'LOCKED' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 pointer-events-none select-none z-10">
                         <div className="rotate-[-15deg] border-4 border-white/20 px-4 py-2">
                             <span className="text-3xl font-black text-white/20 uppercase tracking-widest whitespace-nowrap">PREVIEW ONLY</span>
                         </div>
                         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-20"></div>
                         <div className="absolute bottom-2 w-full text-center">
                             <span className="text-[10px] text-white/40 uppercase tracking-[0.3em]">Property of Architex</span>
                         </div>
                    </div>
                )}
                
                {/* Format Badge */}
                <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur rounded text-xs font-bold text-white border border-white/10">
                    {design.format}
                </div>
              </div>

              {/* Action Area */}
              <div className="p-5 flex-1 flex flex-col justify-between bg-gradient-to-b from-transparent to-black/40">
                <div>
                    <h3 className="text-lg font-bold text-white mb-1 truncate">{design.title}</h3>
                    <p className="text-xs text-gray-400 font-mono mb-4">
                        Generated: {new Date(design.timestamp).toLocaleDateString()}
                    </p>
                </div>

                <div className="mt-auto space-y-3">
                    {design.status === 'LOCKED' ? (
                        <div>
                            <div className="flex justify-between items-end mb-3">
                                <span className="text-xs text-neon-pink">Encryption Active</span>
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
                                        <span>Confirming on Chain...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                        <span>Pay & Unlock High-Res</span>
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div>
                             <div className="flex justify-between items-end mb-3">
                                <span className="text-xs text-green-400">License Acquired</span>
                                <span className="text-xs text-gray-400">Ready for Export</span>
                            </div>
                            <button 
                                onClick={() => handleDownload(design)}
                                className="w-full py-2 bg-white/10 border border-green-500/30 text-green-400 rounded-lg font-bold text-sm hover:bg-green-500/10 transition-all flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                Download Source File
                            </button>
                        </div>
                    )}
                    
                    {/* Contextual Messaging Trigger */}
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
          ))}
        </div>
      )}
    </div>
  );
};
