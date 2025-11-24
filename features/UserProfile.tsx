
import React, { useEffect, useState, useRef } from 'react';
import { UserSession, DesignAsset, UserTier } from '../types';
import { GlassCard } from '../components/GlassCard';
import { dalGetUserDesigns, dalSubmitInstallationProof, dalUpgradeTier } from '../services/dataAccessLayer';
import { piService } from '../services/piService';
import { oracleService } from '../services/oracleService';
import { UI_CONSTANTS, PAYMENT_CONFIG } from '../constants';

interface UserProfileProps {
  session: UserSession;
  onRefresh?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ session, onRefresh }) => {
  const [portfolio, setPortfolio] = useState<DesignAsset[]>([]);
  const [subscribingTier, setSubscribingTier] = useState<string | null>(null);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'PORTFOLIO' | 'DEVELOPER'>('PORTFOLIO');

  // Developer API State
  const [hasApiKey, setHasApiKey] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [loadingApi, setLoadingApi] = useState(false);

  // Proof Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingDesignId, setUploadingDesignId] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    fetchDesigns();
  }, []);

  const fetchDesigns = async () => {
    const data = await dalGetUserDesigns();
    setPortfolio(data);
  };

  const handleSubscribe = async (tierName: string, cost: number, isApi: boolean = false) => {
    setSubscribingTier(tierName);
    try {
        await piService.createTreasuryPayment(
            isApi ? `Architex API License (1 Year)` : `Architex ${tierName} Subscription (1 Month)`,
            cost,
            {
                onReadyForServerApproval: async (pid) => console.log("Intent approved", pid),
                onReadyForServerCompletion: async (pid, txid) => {
                    if (isApi) {
                         const newKey = `sk_live_architex_${Math.random().toString(36).substr(2, 16)}`;
                         setApiKey(newKey);
                         setHasApiKey(true);
                         alert("API License Activated! Key Generated.");
                    } else {
                         // Upgrade User Tier in DAL
                         const targetTier = tierName === 'Pro' ? 'PRO' : 'ACCELERATOR';
                         await dalUpgradeTier(targetTier as UserTier);
                         
                         alert(`Welcome to ${tierName}! Ads have been removed.`);
                         
                         // Refresh Session in App.tsx
                         if (onRefresh) onRefresh();
                    }
                    setSubscribingTier(null);
                },
                onCancel: () => setSubscribingTier(null),
                onError: (e) => {
                    alert("Payment failed.");
                    setSubscribingTier(null);
                }
            }
        );
    } catch (e) {
        setSubscribingTier(null);
    }
  };

  const testApiEndpoint = async () => {
      if (!apiKey) return;
      setLoadingApi(true);
      try {
          const data = await oracleService.getMarketDataAPI(apiKey);
          setApiResponse(JSON.stringify(data, null, 2));
      } catch (e) {
          setApiResponse("Error: Could not fetch data.");
      } finally {
          setLoadingApi(false);
      }
  };

  const triggerUpload = (designId: string) => {
      setUploadingDesignId(designId);
      fileInputRef.current?.click();
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || !e.target.files[0] || !uploadingDesignId) return;
      
      const file = e.target.files[0];
      const reader = new FileReader();

      setIsVerifying(true);

      reader.onloadend = async () => {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1];
          
          try {
             const result = await dalSubmitInstallationProof(uploadingDesignId, base64Data);
             if (result.success) {
                 alert(`Verification Successful! +${result.reward} ARTX Cashback has been granted to your wallet.`);
                 fetchDesigns(); // Refresh UI to show verify status
                 // Ideally trigger an app-level balance refresh here as well
             } else {
                 alert(`Verification Failed: ${result.reason}`);
             }
          } catch (err) {
             alert("Error submitting proof.");
          } finally {
             setIsVerifying(false);
             setUploadingDesignId(null);
             if (fileInputRef.current) fileInputRef.current.value = '';
          }
      };

      reader.readAsDataURL(file);
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
            {/* Tier Badge */}
            {session.tier !== 'FREE' && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-amber-600 text-black font-bold text-[10px] px-2 py-1 rounded-full shadow-lg border border-white/20">
                    {session.tier}
                </div>
            )}
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
                 {session.tier === 'FREE' ? (
                     <>
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
                     </>
                 ) : (
                     <div className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm font-bold flex items-center gap-2">
                         <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                         Active {session.tier} Plan (Ads Free)
                     </div>
                 )}
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
        <button 
            onClick={() => setActiveTab('PORTFOLIO')}
            className={`px-6 py-3 font-bold text-sm transition-colors ${activeTab === 'PORTFOLIO' ? 'text-neon-cyan border-b-2 border-neon-cyan' : 'text-gray-500 hover:text-white'}`}
        >
            Portfolio
        </button>
        <button 
            onClick={() => setActiveTab('DEVELOPER')}
            className={`px-6 py-3 font-bold text-sm transition-colors flex items-center gap-2 ${activeTab === 'DEVELOPER' ? 'text-neon-cyan border-b-2 border-neon-cyan' : 'text-gray-500 hover:text-white'}`}
        >
            Developer API
            <span className="px-1.5 py-0.5 bg-neon-purple/20 text-neon-purple text-[10px] rounded border border-neon-purple/50">NEW</span>
        </button>
      </div>

      {/* Hidden File Input for Proofs */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleProofUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* View Content */}
      {activeTab === 'PORTFOLIO' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolio.map(design => {
                const proofStatus = design.installationProof?.status || 'NONE';
                const isProofVerified = proofStatus === 'VERIFIED';
                const isProofRejected = proofStatus === 'REJECTED';

                return (
                    <GlassCard key={design.id} className="group !p-0 overflow-hidden relative flex flex-col h-full">
                        <img src={design.thumbnailUrl} alt={design.title} className="w-full h-48 object-cover" />
                        <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                                <h3 className="font-bold text-white">{design.title}</h3>
                                <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                                    <span>{new Date(design.timestamp).toLocaleDateString()}</span>
                                    <span className={design.status === 'LOCKED' ? 'text-orange-400' : 'text-green-400'}>
                                        {design.status}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Cashback / Proof of Build Section */}
                            {(design.status === 'UNLOCKED' || design.status === 'MINTED') && (
                                <div className="mt-4 pt-4 border-t border-white/5">
                                    {isProofVerified ? (
                                        <div className="bg-green-500/10 border border-green-500/30 rounded p-2 flex items-center gap-2 animate-[pulse_3s_infinite]">
                                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-green-400">Verified Build</div>
                                                <div className="text-[10px] text-gray-400">+{design.installationProof?.rewardAmount} ARTX Cashback</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            {isProofRejected && (
                                                <div className="text-[10px] text-red-400 mb-2">Verification Failed. Try a clearer photo.</div>
                                            )}
                                            <button 
                                                onClick={() => triggerUpload(design.id)}
                                                disabled={isVerifying && uploadingDesignId === design.id}
                                                className="w-full py-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 border border-white/10 rounded-lg text-xs font-bold text-gray-300 hover:text-white transition-all flex items-center justify-center gap-2"
                                            >
                                                {isVerifying && uploadingDesignId === design.id ? (
                                                    <span className="animate-pulse">Analyzing Real World Data...</span>
                                                ) : (
                                                    <>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                        Upload Proof of Build
                                                    </>
                                                )}
                                            </button>
                                            <div className="text-[10px] text-center text-gray-500 mt-1">Get 25 ARTX Cashback</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </GlassCard>
                );
            })}
        </div>
      ) : (
        /* DEVELOPER API VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Product Card */}
            <div className="lg:col-span-1 space-y-6">
                <GlassCard className="border-neon-cyan/30 flex flex-col items-center text-center p-6">
                    <div className="w-16 h-16 bg-neon-cyan/10 rounded-full flex items-center justify-center mb-4 border border-neon-cyan/50 shadow-[0_0_20px_rgba(0,243,255,0.2)]">
                        <svg className="w-8 h-8 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    </div>
                    <h3 className="text-xl font-display font-bold text-white mb-2">Architex Price Index API</h3>
                    <p className="text-sm text-gray-400 mb-6">
                        Access real-time, cryptographically verified pricing data for ARTX and related assets. Ideal for DApp developers and quantitative traders.
                    </p>
                    
                    <ul className="text-left text-sm text-gray-300 space-y-2 mb-8 w-full px-4">
                        <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Real-time WebSocket Feed</li>
                        <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Historical Data Snapshots</li>
                        <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 99.9% Uptime SLA</li>
                        <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Oracle Signatures</li>
                    </ul>

                    {hasApiKey ? (
                        <div className="w-full p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 font-bold text-sm">
                            License Active
                        </div>
                    ) : (
                        <button 
                            onClick={() => handleSubscribe('Developer API', PAYMENT_CONFIG.apiLicenseCost, true)}
                            disabled={!!subscribingTier}
                            className="w-full py-3 bg-gradient-to-r from-neon-cyan to-blue-600 text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            {subscribingTier === 'Developer API' ? 'Verifying Payment...' : `Buy License (${PAYMENT_CONFIG.apiLicenseCost} Pi/Year)`}
                        </button>
                    )}
                </GlassCard>
            </div>

            {/* Console */}
            <div className="lg:col-span-2">
                <GlassCard title="Developer Console" className="h-full">
                    {hasApiKey ? (
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold">Your Secret API Key</label>
                                <div className="flex gap-2 mt-1">
                                    <code className="flex-1 bg-black/40 border border-white/10 rounded p-3 text-neon-cyan font-mono text-sm break-all">
                                        {apiKey}
                                    </code>
                                    <button className="px-4 bg-white/5 border border-white/10 rounded text-gray-400 hover:text-white" onClick={() => alert("Copied!")}>
                                        Copy
                                    </button>
                                </div>
                                <p className="text-xs text-red-400 mt-2">Do not share this key. It grants access to your paid quota.</p>
                            </div>

                            <div className="border-t border-white/10 pt-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold text-white">Endpoint Tester</h4>
                                    <button 
                                        onClick={testApiEndpoint}
                                        disabled={loadingApi}
                                        className="px-4 py-2 bg-neon-purple/20 text-neon-purple border border-neon-purple/30 rounded text-xs font-bold hover:bg-neon-purple/30 transition-all"
                                    >
                                        {loadingApi ? 'Fetching...' : 'GET /v1/market/index'}
                                    </button>
                                </div>
                                
                                <div className="bg-black/50 rounded-lg p-4 font-mono text-xs text-gray-300 h-64 overflow-y-auto border border-white/5 shadow-inner">
                                    {apiResponse ? (
                                        <pre>{apiResponse}</pre>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-gray-600">
                                            Click 'GET' to test your API key against the Oracle.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-50 p-8">
                            <div className="text-6xl mb-4">🔒</div>
                            <h3 className="text-xl font-bold text-white">Console Locked</h3>
                            <p className="text-gray-400">Purchase a license to generate keys and access the sandbox.</p>
                        </div>
                    )}
                </GlassCard>
            </div>
        </div>
      )}
    </div>
  );
};
