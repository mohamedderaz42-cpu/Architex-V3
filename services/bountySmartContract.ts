
import { Bounty, BountyStatus, ContractPayout, Dispute } from "../types";
import { CONTRACT_CONFIG } from "../constants";
import { stakingService } from "./stakingService";
import { dalCreateDispute, dalGetDisputeById, dalUpdateDispute } from "./dataAccessLayer";

// --- SECURE VAULT STORAGE (Simulated On-Chain State) ---
interface VaultRecord {
  contractId: string;
  lockedBalance: number;
  depositor: string;
  beneficiary: string | null;
  state: 'LOCKED' | 'RELEASED' | 'REFUNDED' | 'DISPUTED';
  createdAt: number;
}

const secureVault = new Map<string, VaultRecord>();

let bountyLedger: Bounty[] = [
  {
    id: 'bounty_101',
    title: 'Futuristic Eco-Skyscraper Concept',
    description: 'Need a 50-story residential tower concept using biomimicry. Must include vertical gardens.',
    price: 150,
    client: 'EcoDeveloper_Pi',
    designer: null,
    status: BountyStatus.OPEN,
    deadline: Date.now() + 604800000,
    tags: ['Architecture', 'Sustainable', 'High-Rise']
  }
];

secureVault.set('bounty_101', {
    contractId: 'bounty_101',
    lockedBalance: 150,
    depositor: 'EcoDeveloper_Pi',
    beneficiary: null,
    state: 'LOCKED',
    createdAt: Date.now()
});

export const bountySmartContract = {
  
  getAllBounties: async (): Promise<Bounty[]> => {
    await new Promise(r => setTimeout(r, 400));
    return [...bountyLedger];
  },

  getEscrowStatus: async (bountyId: string): Promise<string> => {
      const record = secureVault.get(bountyId);
      return record ? record.state : 'UNKNOWN';
  },

  // Helper for B2B Dynamic Fees
  calculateDynamicFee: (amount: number): number => {
      // Phase 9.4: Tiered Commissions
      if (amount > 1000000) return 0.02; // 2% for >1M
      if (amount > 100000) return 0.04;  // 4% for >100k
      return CONTRACT_CONFIG.PLATFORM_COMMISSION_RATE; // Default 10%
  },

  createBounty: async (title: string, description: string, price: number, clientUser: string): Promise<Bounty> => {
    if (price <= 0) throw new Error("Price must be positive");
    if (!title || !description) throw new Error("Invalid payload");

    await new Promise(r => setTimeout(r, 1000));
    
    const newId = `bounty_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const vaultRecord: VaultRecord = {
        contractId: newId,
        lockedBalance: price,
        depositor: clientUser,
        beneficiary: null,
        state: 'LOCKED',
        createdAt: Date.now()
    };
    secureVault.set(newId, vaultRecord);
    console.log(`[SmartContract] FUNDS LOCKED: ${price} Pi for ${newId}`);

    const newBounty: Bounty = {
      id: newId,
      title,
      description,
      price,
      client: clientUser,
      designer: null,
      status: BountyStatus.OPEN,
      deadline: Date.now() + (7 * 24 * 60 * 60 * 1000), 
      tags: ['Escrow Secured']
    };
    
    bountyLedger.unshift(newBounty);
    return newBounty;
  },

  claimBounty: async (bountyId: string, designerUser: string): Promise<Bounty> => {
    await new Promise(r => setTimeout(r, 600));
    const idx = bountyLedger.findIndex(b => b.id === bountyId);
    const vaultRecord = secureVault.get(bountyId);

    if (idx === -1 || !vaultRecord) throw new Error("Contract not found");
    if (bountyLedger[idx].status !== BountyStatus.OPEN) throw new Error("Contract is not Open");
    
    bountyLedger[idx].designer = designerUser;
    bountyLedger[idx].status = BountyStatus.ASSIGNED;
    vaultRecord.beneficiary = designerUser;
    secureVault.set(bountyId, vaultRecord);
    
    return bountyLedger[idx];
  },

  submitWork: async (bountyId: string): Promise<Bounty> => {
    await new Promise(r => setTimeout(r, 600));
    const idx = bountyLedger.findIndex(b => b.id === bountyId);
    if (idx === -1) throw new Error("Bounty not found");
    bountyLedger[idx].status = BountyStatus.SUBMITTED;
    return bountyLedger[idx];
  },

  executeContract: async (bountyId: string): Promise<ContractPayout> => {
    await new Promise(r => setTimeout(r, 1500)); 
    
    const idx = bountyLedger.findIndex(b => b.id === bountyId);
    const vaultRecord = secureVault.get(bountyId);

    if (idx === -1 || !vaultRecord) throw new Error("Contract Record Missing");
    if (vaultRecord.state !== 'LOCKED') throw new Error("Funds already released");

    const totalLocked = vaultRecord.lockedBalance;
    const designer = bountyLedger[idx].designer;
    if (!designer) throw new Error("No beneficiary assigned");

    // Staking Discount Logic
    const isStaker = await stakingService.hasActiveStake(designer);
    
    // Use Dynamic Fee calculation based on volume, then apply staker discount if applicable
    let baseFeeRate = bountySmartContract.calculateDynamicFee(totalLocked);
    
    if (isStaker) {
        baseFeeRate = baseFeeRate * CONTRACT_CONFIG.STAKING_DISCOUNT_RATE;
    }

    const platformFee = totalLocked * baseFeeRate;
    const designerAmount = totalLocked - platformFee;

    vaultRecord.state = 'RELEASED';
    vaultRecord.lockedBalance = 0;
    secureVault.set(bountyId, vaultRecord);

    bountyLedger[idx].status = BountyStatus.COMPLETED;

    console.log(`[SmartContract] RELEASE: ${totalLocked} Pi. Fee: ${platformFee} (${(baseFeeRate*100).toFixed(1)}%)`);

    return {
      total: totalLocked,
      platformFee,
      designerAmount,
      timestamp: Date.now(),
      discountApplied: isStaker
    };
  },

  initiateDispute: async (bountyId: string, initiator: string, reason: string): Promise<Dispute> => {
      await new Promise(r => setTimeout(r, 1000));
      const idx = bountyLedger.findIndex(b => b.id === bountyId);
      const vaultRecord = secureVault.get(bountyId);

      if (idx === -1 || !vaultRecord) throw new Error("Contract not found");
      
      vaultRecord.state = 'DISPUTED';
      secureVault.set(bountyId, vaultRecord);
      bountyLedger[idx].status = BountyStatus.DISPUTED;

      const respondent = bountyLedger[idx].client === initiator ? bountyLedger[idx].designer! : bountyLedger[idx].client;
      const dispute = await dalCreateDispute(bountyId, initiator, respondent, reason);
      bountyLedger[idx].disputeId = dispute.id;

      return dispute;
  },

  resolveDispute: async (disputeId: string, winner: string, splitPercentage: number): Promise<void> => {
      await new Promise(r => setTimeout(r, 1500));
      const dispute = await dalGetDisputeById(disputeId);
      if (!dispute) throw new Error("Dispute not found");

      const bountyId = dispute.bountyId;
      const vaultRecord = secureVault.get(bountyId);
      
      vaultRecord!.state = 'RELEASED';
      vaultRecord!.lockedBalance = 0;
      secureVault.set(bountyId, vaultRecord!);

      dispute.status = 'RESOLVED';
      dispute.ruling = { winner, splitPercentage, reason: 'Smart Contract Execution', timestamp: Date.now() };
      await dalUpdateDispute(dispute);

      const bIdx = bountyLedger.findIndex(b => b.id === bountyId);
      if (bIdx > -1) bountyLedger[bIdx].status = BountyStatus.COMPLETED;
  }
};
