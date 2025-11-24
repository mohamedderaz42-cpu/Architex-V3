import React, { useEffect, useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { stakingService } from '../services/stakingService';
import { stellarService } from '../services/stellarService';
import { StakingPool, UserStake } from '../types';
import { UI_CONSTANTS } from '../constants';

export const StakingVault: React.FC = () => {
  const [pools, setPools] = useState<StakingPool[]>([]);
  const [userStakes, setUserStakes] = useState<UserStake[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
  // Interaction State
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [processing, setProcessing] = useState(false);

  // Auto-refresh rewards display
  useEffect(() => {
    const timer = setInterval(() => {
       if (!processing && !loading) fetchUserData();
    }, 5000);
    return () => clearInterval(timer);
  }, [processing, loading]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    const poolData = await stakingService.getPools();
    setPools(poolData);
    await fetchUserData();
    setLoading(false);
  };

  const fetchUserData = async () => {
    const stakes = await stakingService.getUserStakes('CURRENT_USER');
    setUserStakes(stakes);
    
    const balances = await stellarService.getChainBalances('CURRENT_USER');
    const artx = balances.find(b => b.assetCode === 'ARTX');
    setWalletBalance(artx ? parseFloat(artx.balance) : 0);
  };

  const handleStake = async () => {
    if (!selectedPoolId || !amountInput) return;
    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) return;
    if (amount > walletBalance) {
        alert("Insufficient Balance");
        return;
    }

    setProcessing(true);
    try {
        await stakingService.stakeTokens(selectedPoolId, amount);
        setAmountInput('');
        setSelectedPoolId(null);
        await fetchUserData();
    } catch (e) {
        console.error(e);
        alert("Staking Transaction Failed");
    } finally {
        setProcessing(false);
    }
  };

  const handleUnstake = async (poolId: string) => {
    if (!confirm("Are you sure you want to unstake? Early withdrawal from locked pools may not be possible.")) return;
    setProcessing(true);
    try {
        await stakingService.unstakeTokens(poolId);
        await fetchUserData();
    } catch (e: any) {
        alert(e.message || "Unstake Failed");
    } finally {
        setProcessing(false);
    }
  };

  const handleClaim = async (poolId: string) => {
    setProcessing(true);
    try {
        const reward = await stakingService.claimRewards(poolId);
        alert(`Claimed ${reward.toFixed(4)} ARTX!`);
        await fetchUserData();
    } catch (e) {
        alert("Claim Failed");
    } finally {
        setProcessing(false);
    }
  };

  // Helper to find stake for a pool
  const getStakeForPool = (poolId: string) => userStakes.find(s => s.poolId === poolId);

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-white">Staking Vault</h2>
          <p className="text-gray-400">Lock ARTX to earn yield and secure the protocol.</p>
        </div>
        <div className="text-right bg-black/30 p-3 rounded-xl border border-white/10">
            <div className="text-xs text-gray-500 uppercase">Available to Stake</div>
            <div className="text-2xl font-mono font-bold text-neon-purple">{walletBalance.toFixed(2)} ARTX</div>
        </div>
      </div>

      {/* Pools Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {pools.map(pool => {
            const userStake = getStakeForPool(pool.id);
            const isSelected = selectedPoolId === pool.id;

            return (
                <GlassCard key={pool.id} className={`relative flex flex-col justify-between transition-all ${userStake ? 'border-neon-cyan/50 shadow-[0_0_20px_rgba(0,243,255,0.1)]' : ''}`}>
                    {/* Header */}
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-white">{pool.name}</h3>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-400">{pool.apy}%</div>
                                <div className="text-[10px] text-gray-500 uppercase">APY</div>
                            </div>
                        </div>
                        <p className="text-sm text-gray-400 mb-4 h-10">{pool.description}</p>
                        
                        {/* Pool Stats */}
                        <div className="flex justify-between text-xs text-gray-500 mb-6 bg-white/5 p-2 rounded">
                            <span>TVL: {pool.totalStaked.toLocaleString()} ARTX</span>
                            <span>Lock: {pool.lockPeriodDays === 0 ? 'Flexible' : `${pool.lockPeriodDays} Days`}</span>
                        </div>
                    </div>

                    {/* Active Stake View */}
                    {userStake ? (
                        <div className="bg-neon-purple/10 border border-neon-purple/30 rounded-lg p-4 mb-2">
                             <div className="flex justify-between mb-2">
                                <span className="text-xs text-gray-300">Staked Balance</span>
                                <span className="text-sm font-bold text-white">{userStake.amount.toFixed(2)} ARTX</span>
                             </div>
                             <div className="flex justify-between mb-4">
                                <span className="text-xs text-neon-cyan">Pending Rewards</span>
                                <span className="text-sm font-bold text-neon-cyan animate-pulse">{userStake.unclaimedRewards.toFixed(6)}</span>
                             </div>
                             <div className="grid grid-cols-2 gap-2">
                                <button 
                                    onClick={() => handleClaim(pool.id)}
                                    disabled={processing || userStake.unclaimedRewards <= 0}
                                    className="py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-xs font-bold hover:bg-green-500/30 transition-all disabled:opacity-50"
                                >
                                    Claim
                                </button>
                                <button 
                                    onClick={() => handleUnstake(pool.id)}
                                    disabled={processing}
                                    className="py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-xs font-bold hover:bg-red-500/20 transition-all disabled:opacity-50"
                                >
                                    Unstake
                                </button>
                             </div>
                        </div>
                    ) : (
                        /* Stake Input View */
                        <div className="mt-auto">
                            {isSelected ? (
                                <div className="space-y-3 animate-[fadeIn_0.3s]">
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={amountInput}
                                            onChange={(e) => setAmountInput(e.target.value)}
                                            placeholder={`Min ${pool.minStake}`}
                                            className="w-full bg-black/40 border border-neon-purple rounded p-3 text-white focus:outline-none"
                                        />
                                        <button 
                                            onClick={() => setAmountInput(walletBalance.toString())}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-neon-purple uppercase font-bold px-2 py-1 bg-white/5 rounded"
                                        >
                                            Max
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button 
                                            onClick={() => setSelectedPoolId(null)}
                                            className="py-2 bg-transparent border border-white/20 text-gray-400 rounded hover:bg-white/5"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={handleStake}
                                            disabled={processing}
                                            className="py-2 bg-neon-purple text-white rounded font-bold hover:bg-neon-purple/80"
                                        >
                                            {processing ? '...' : 'Confirm'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => setSelectedPoolId(pool.id)}
                                    className="w-full py-3 bg-white/5 hover:bg-neon-purple/20 border border-white/10 hover:border-neon-purple/50 rounded-lg text-white font-bold transition-all"
                                >
                                    Stake Now
                                </button>
                            )}
                        </div>
                    )}
                </GlassCard>
            );
        })}
      </div>
    </div>
  );
};