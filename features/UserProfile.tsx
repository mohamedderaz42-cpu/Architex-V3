
import React, { useEffect, useState } from 'react';
import { UserSession, DesignAsset } from '../types';
import { GlassCard } from '../components/GlassCard';
import { dalGetUserDesigns } from '../services/dataAccessLayer';
import { piService } from '../services/piService';
import { UI_CONSTANTS, PAYMENT_CONFIG } from '../constants';

interface UserProfileProps {
  session: UserSession;
}

export const UserProfile: React.FC<UserProfileProps> = ({ session }) => {
  const [portfolio, setPortfolio] = useState<DesignAsset[]>([]);
  const [subscribingTier, setSubscribingTier] = useState<string | null>(null);

  useEffect(() => {
    const fetchDesigns = async () => {
      const data = await dalGetUserDesigns();
      setPortfolio(data);
    };
    fetchDesigns();
  }, []);

  const handleSubscribe = async (tierName: string, cost: number) => {
    setSubscribingTier(tierName);
    try {
        await piService.createTreasuryPayment(
            `Architex ${tierName} Subscription (1 Month)`,
            cost,
            {
                onReadyForServerApproval: async (pid) => console.log("Sub intent approved", pid),
                onReadyForServerCompletion: async (pid, txid) => {
                    alert(`Welcome to ${tierName}! Subscription Fee routed to Treasury.`);
                    setSubscribingTier(null);
                },
                onCancel: () => setSubscribingTier(null),
                onError: (e) => {
                    alert("Subscription failed.");
                    setSubscribingTier(null);
                }
            }
        );
    } catch (e) {
        setSubscribingTier(null);
    }
  };

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      {/* Identity Header */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800 border border-white/10 p-8">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-neon-purple/10 blur-[100px] rounded-full"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-br from-neon-cyan to-neon-purple">
                <img src={session.avatarUrl} alt="Profile" className="w-full h-full rounded-full object-cover border-4 border-slate-900" />
            </div>
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full border-4 border-slate-900 flex items-center justify-center text-white text-[10px]" title="Online">
                ✓
            </div>
          </div>

          {/* User Info */}
          <div className="text-center md:text-left flex-1">
            <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                <h1 className="text-3xl font-display font-bold text-white">{session.username}</h1>
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3z" /></svg>
                    Verified Pi Identity
                </span>
            </div>
            
            <div className="flex items-center gap-2 justify-center md:justify-start text-gray-400 font-mono text-sm bg-black/30 w-fit mx-auto md:mx-0 px-3 py-1 rounded-lg border border-white/5">
                <span>{session.walletAddress}</span>
                <button className="hover:text-white transition-colors" title="Copy Address">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </button>
            </div>
            
            <p className="mt-4 text-gray-400 max-w-lg">
                Architect & Generative Designer on the Pi Network. Creating sustainable structures for the metaverse and physical world.
            </p>

            <div className="mt-4 flex gap-4 justify-center md:justify-start">
                 <button 
                    onClick={() => handleSubscribe('Pro', PAYMENT_CONFIG.subscriptionCost)}
                    disabled={!!subscribingTier}
                    className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white text-xs font-bold rounded-lg shadow-lg hover:shadow-yellow-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                 >
                    {subscribingTier === 'Pro' ? 'Processing...' : `Upgrade to Pro (${PAYMENT_CONFIG.subscriptionCost} Pi)`}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                 </button>

                 <button 
                    onClick={() => handleSubscribe('Accelerator', PAYMENT_CONFIG.acceleratorCost)}
                    disabled={!!subscribingTier}
                    className="px-4 py-2 bg-gradient-to-r from-neon-purple to-pink-600 text-white text-xs font-bold rounded-lg shadow-lg hover:shadow-neon-pink/20 transition-all flex items-center gap-2 disabled:opacity-50"
                 >
                    {subscribingTier === 'Accelerator' ? 'Processing...' : `Accelerator Tier (${PAYMENT_CONFIG.acceleratorCost} Pi)`}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                 </button>
            </div>
          </div>

          {/* Key Stats */}
          <div className="flex gap-6 border-l border-white/10 pl-8">
            <div className="text-center">
                <div className="text-2xl font-bold text-white">{session.stats.designsCreated}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Creations</div>
            </div>
            <div className="text-center">
                <div className="text-2xl font-bold text-neon-pink">{session.stats.likesReceived}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Likes</div>
            </div>
             <div className="text-center">
                <div className="text-2xl font-bold text-neon-cyan">{session.stats.volumeTraded}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Vol (ARTX)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button className="px-6 py-3 text-neon-cyan border-b-2 border-neon-cyan font-bold text-sm">Portfolio</button>
        <button className="px-6 py-3 text-gray-500 hover:text-white transition-colors text-sm">Collection</button>
        <button className="px-6 py-3 text-gray-500 hover:text-white transition-colors text-sm">Activity</button>
      </div>

      {/* Portfolio Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {portfolio.map(design => (
             <GlassCard key={design.id} className="group !p-0 overflow-hidden relative">
                <img src={design.thumbnailUrl} alt={design.title} className="w-full h-48 object-cover" />
                <div className="p-4">
                    <h3 className="font-bold text-white">{design.title}</h3>
                    <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                        <span>{new Date(design.timestamp).toLocaleDateString()}</span>
                        <span className={design.status === 'LOCKED' ? 'text-orange-400' : 'text-green-400'}>
                            {design.status}
                        </span>
                    </div>
                </div>
             </GlassCard>
        ))}
      </div>
    </div>
  );
};