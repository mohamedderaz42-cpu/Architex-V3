import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { dalGetUserDesigns } from '../services/dataAccessLayer';
import { nftContractService } from '../services/nftContractService';
import { stellarService } from '../services/stellarService'; // To check balance
import { DesignAsset, NFTMetadata } from '../types';
import { NFT_CONFIG, UI_CONSTANTS } from '../constants';

export const NFTFactory: React.FC = () => {
  const [designs, setDesigns] = useState<DesignAsset[]>([]);
  const [selectedDesign, setSelectedDesign] = useState<DesignAsset | null>(null);
  const [artxBalance, setArtxBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
  // Minting State Machine
  const [mintStatus, setMintStatus] = useState<'IDLE' | 'CHECKING' | 'MINTING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [statusMessage, setStatusMessage] = useState('');
  const [mintedNFT, setMintedNFT] = useState<NFTMetadata | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    // Fetch designs and filter for Unlocked ones that aren't minted yet
    const allDesigns = await dalGetUserDesigns();
    const mintable = allDesigns.filter(d => d.status === 'UNLOCKED' && !d.nftId);
    setDesigns(mintable);

    // Fetch ARTX Balance (Mocked via stellarService)
    const balances = await stellarService.getChainBalances('CURRENT_USER');
    const artx = balances.find(b => b.assetCode === 'ARTX');
    setArtxBalance(artx ? parseFloat(artx.balance) : 0);

    setLoading(false);
  };

  const handleMint = async () => {
    if (!selectedDesign) return;
    
    setMintStatus('CHECKING');
    setStatusMessage('Verifying ARTX Balance & Allowance...');

    try {
        // 1. Eligibility Check
        const eligibility = await nftContractService.checkEligibility('CURRENT_USER', artxBalance);
        
        if (!eligibility.eligible) {
            setMintStatus('ERROR');
            setStatusMessage(eligibility.reason || 'Transaction Failed');
            return;
        }

        // 2. Execute Smart Contract
        setMintStatus('MINTING');
        setStatusMessage('Uploading Metadata to IPFS & Executing Contract...');
        
        const nft = await nftContractService.mintDesignAsNFT(selectedDesign, 'CURRENT_USER');
        
        setMintedNFT(nft);
        setMintStatus('SUCCESS');
        
        // Update local list (remove minted item)
        setDesigns(prev => prev.filter(d => d.id !== selectedDesign.id));

    } catch (e) {
        setMintStatus('ERROR');
        setStatusMessage('Smart Contract Execution Failed.');
    }
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex justify-between items-end">
        <div>
           <h2 className="text-3xl font-display font-bold text-white">NFT Factory</h2>
           <p className="text-gray-400">Mint your architectural designs as unique digital assets.</p>
        </div>
        <div className="text-right">
            <div className="text-xs text-gray-500 uppercase">Available Balance</div>
            <div className="text-2xl font-mono font-bold text-neon-purple">{artxBalance.toFixed(2)} ARTX</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Selector */}
        <div className="lg:col-span-2 space-y-4">
             <h3 className="text-lg font-bold text-white mb-2">Select Mintable Blueprint</h3>
             
             {loading ? (
                 <div className="animate-pulse space-y-4">
                     <div className="h-24 bg-white/5 rounded-xl"></div>
                     <div className="h-24 bg-white/5 rounded-xl"></div>
                 </div>
             ) : designs.length === 0 ? (
                 <div className="p-8 border border-dashed border-white/10 rounded-xl text-center text-gray-500">
                     No unlocked blueprints available. Unlock designs in the Store first.
                 </div>
             ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {designs.map(design => (
                         <div 
                            key={design.id}
                            onClick={() => {
                                setSelectedDesign(design);
                                setMintStatus('IDLE');
                                setMintedNFT(null);
                            }}
                            className={`p-3 rounded-xl cursor-pointer border transition-all flex items-center gap-4 ${
                                selectedDesign?.id === design.id 
                                ? 'bg-neon-purple/20 border-neon-purple shadow-[0_0_15px_rgba(124,58,237,0.2)]' 
                                : 'bg-white/5 border-white/5 hover:bg-white/10'
                            }`}
                         >
                            <img src={design.thumbnailUrl} className="w-16 h-16 rounded object-cover" />
                            <div>
                                <h4 className="font-bold text-white text-sm">{design.title}</h4>
                                <div className="text-[10px] text-gray-400 uppercase mt-1">{design.format} • {new Date(design.timestamp).toLocaleDateString()}</div>
                            </div>
                         </div>
                     ))}
                 </div>
             )}
        </div>

        {/* Right Column: Minting Console */}
        <div className="lg:col-span-1">
            <GlassCard className="h-full flex flex-col border-neon-cyan/30">
                <div className="flex-1">
                    <h3 className="text-xl font-display font-bold text-white border-b border-white/10 pb-4 mb-4">
                        Fabrication Console
                    </h3>

                    {selectedDesign ? (
                        <div className="space-y-6">
                            <div className="aspect-video w-full rounded-lg overflow-hidden border border-white/10 relative">
                                <img src={selectedDesign.thumbnailUrl} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                                    <span className="font-mono text-neon-cyan text-xs">{selectedDesign.id}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Minting Fee</span>
                                    <span className="font-bold text-white">{NFT_CONFIG.MINTING_FEE_ARTX} ARTX</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Network Gas (Stellar)</span>
                                    <span className="font-bold text-gray-400">~0.0001 XLM</span>
                                </div>
                                <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                                    <span className="text-gray-300">Total Cost</span>
                                    <span className="font-bold text-neon-purple">{NFT_CONFIG.MINTING_FEE_ARTX} ARTX</span>
                                </div>
                            </div>

                            {/* Insufficient Balance Warning */}
                            {artxBalance < NFT_CONFIG.MINTING_FEE_ARTX && (
                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-300 text-center">
                                    Insufficient ARTX Balance. <br/>
                                    <span className="underline cursor-pointer font-bold">Swap Pi for ARTX in DeFi</span>
                                </div>
                            )}

                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                            <p>Select a blueprint to begin</p>
                        </div>
                    )}
                </div>

                {/* Status Overlay */}
                {mintStatus === 'SUCCESS' && mintedNFT && (
                    <div className="absolute inset-0 bg-black/90 z-20 flex flex-col items-center justify-center p-6 text-center animate-[fadeIn_0.5s]">
                        <div className="w-20 h-20 rounded-full border-4 border-green-500 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(34,197,94,0.5)]">
                            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <h4 className="text-2xl font-bold text-white mb-2">Mint Successful!</h4>
                        <p className="text-gray-400 text-sm mb-4">Token ID: <span className="text-neon-cyan font-mono">{mintedNFT.tokenId}</span></p>
                        <button 
                            onClick={() => {
                                setMintStatus('IDLE');
                                setSelectedDesign(null);
                            }}
                            className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm transition-colors"
                        >
                            Mint Another
                        </button>
                    </div>
                )}

                <div className="mt-6">
                    <button 
                        onClick={handleMint}
                        disabled={!selectedDesign || mintStatus !== 'IDLE' || artxBalance < NFT_CONFIG.MINTING_FEE_ARTX}
                        className={`w-full py-4 rounded-lg font-bold text-lg transition-all relative overflow-hidden ${
                            mintStatus === 'MINTING' || mintStatus === 'CHECKING'
                            ? 'bg-gray-800 text-gray-400' 
                            : 'bg-gradient-to-r from-neon-purple to-neon-cyan text-black hover:shadow-[0_0_20px_rgba(0,243,255,0.4)]'
                        } disabled:opacity-50 disabled:shadow-none`}
                    >
                        {mintStatus === 'CHECKING' && 'Verifying...'}
                        {mintStatus === 'MINTING' && 'Minting...'}
                        {mintStatus === 'ERROR' && 'Try Again'}
                        {mintStatus === 'IDLE' && 'MINT NFT'}
                        
                        {(mintStatus === 'MINTING' || mintStatus === 'CHECKING') && (
                            <div className="absolute bottom-0 left-0 h-1 bg-neon-cyan animate-[loading_2s_ease-in-out_infinite]" style={{width: '100%'}}></div>
                        )}
                    </button>
                    {statusMessage && mintStatus !== 'SUCCESS' && (
                        <p className={`text-center text-xs mt-3 ${mintStatus === 'ERROR' ? 'text-red-400' : 'text-neon-cyan animate-pulse'}`}>
                            {statusMessage}
                        </p>
                    )}
                </div>
            </GlassCard>
        </div>
      </div>
    </div>
  );
};