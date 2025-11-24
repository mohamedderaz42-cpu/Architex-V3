import { StakingPool, UserStake } from "../types";
import { STAKING_CONFIG } from "../constants";

// In-memory simulation of Smart Contract State
let globalStaked: Record<string, number> = {
  'pool_flex': 150000,
  'pool_validator': 450000,
  'pool_governance': 1200000
};

// Mock User Stakes
let userStakes: UserStake[] = [];

export const stakingService = {
  
  /**
   * Get Pool Info with live TVL (Total Value Locked)
   */
  getPools: async (): Promise<StakingPool[]> => {
    // Simulate Chain Read
    await new Promise(r => setTimeout(r, 600));
    
    return STAKING_CONFIG.POOLS.map(p => ({
      ...p,
      totalStaked: globalStaked[p.id] || 0
    }));
  },

  /**
   * Get User's active stakes
   */
  getUserStakes: async (walletAddress: string): Promise<UserStake[]> => {
    await new Promise(r => setTimeout(r, 400));
    
    // Simulate real-time reward calculation based on time delta
    const now = Date.now();
    
    // Update rewards for view
    return userStakes.map(stake => {
      const pool = STAKING_CONFIG.POOLS.find(p => p.id === stake.poolId);
      if (!pool) return stake;

      // Simple APY Calc: Amount * (APY/100) * (TimeDelta in Years)
      const secondsElapsed = (now - stake.lastClaimTime) / 1000;
      const yearInSeconds = 31536000;
      const newRewards = stake.amount * (pool.apy / 100) * (secondsElapsed / yearInSeconds);

      return {
        ...stake,
        unclaimedRewards: stake.unclaimedRewards + newRewards
      };
    });
  },

  /**
   * Check if a specific address has active stakes.
   * Used for platform utility/discounts.
   */
  hasActiveStake: async (walletAddress: string): Promise<boolean> => {
    // In a real app, verify against the blockchain ledger for the specific address.
    // For this simulation, we check the local memory store.
    // We assume 'CURRENT_USER' or specific usernames map to the mock session.
    
    // For demo purposes, we check if the global userStakes (simulating current session)
    // has any active deposits.
    if (userStakes.some(s => s.amount > 0)) {
        return true;
    }
    return false;
  },

  /**
   * STAKE (Deposit) Contract Call
   */
  stakeTokens: async (poolId: string, amount: number): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 1000));
    
    // Find existing stake to merge, or create new
    const existingIdx = userStakes.findIndex(s => s.poolId === poolId);
    
    if (existingIdx > -1) {
      // Claim pending rewards before adding to principal (auto-compound logic or separate claim)
      // For simplicity here, we just add to principal and reset timestamp
      userStakes[existingIdx].amount += amount;
    } else {
      userStakes.push({
        poolId,
        amount,
        startTime: Date.now(),
        lastClaimTime: Date.now(),
        unclaimedRewards: 0
      });
    }

    // Update Global TVL
    if (globalStaked[poolId]) globalStaked[poolId] += amount;

    return true;
  },

  /**
   * UNSTAKE (Withdraw) Contract Call
   */
  unstakeTokens: async (poolId: string): Promise<void> => {
    await new Promise(r => setTimeout(r, 1000));
    const idx = userStakes.findIndex(s => s.poolId === poolId);
    if (idx === -1) throw new Error("No stake found");

    const stake = userStakes[idx];
    const pool = STAKING_CONFIG.POOLS.find(p => p.id === poolId);

    // Check Lock Period
    if (pool && pool.lockPeriodDays > 0) {
      const unlockTime = stake.startTime + (pool.lockPeriodDays * 24 * 60 * 60 * 1000);
      if (Date.now() < unlockTime) {
        throw new Error(`Tokens locked until ${new Date(unlockTime).toLocaleDateString()}`);
      }
    }

    // Remove Stake
    userStakes.splice(idx, 1);
    
    // Update Global TVL
    if (globalStaked[poolId]) globalStaked[poolId] -= stake.amount;
  },

  /**
   * CLAIM REWARDS Contract Call
   */
  claimRewards: async (poolId: string): Promise<number> => {
    await new Promise(r => setTimeout(r, 800));
    const idx = userStakes.findIndex(s => s.poolId === poolId);
    if (idx === -1) return 0;

    // Recalculate one last time
    const stake = await stakingService.getUserStakes('user'); // Reuse calculation logic
    const updatedStake = stake.find(s => s.poolId === poolId);
    
    if (!updatedStake) return 0;
    
    const rewardToTransfer = updatedStake.unclaimedRewards;

    // Reset Ledger
    userStakes[idx].unclaimedRewards = 0;
    userStakes[idx].lastClaimTime = Date.now();

    return rewardToTransfer;
  }
};