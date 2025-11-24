

import { Bounty, BountyStatus, ContractPayout } from "../types";
import { CONTRACT_CONFIG } from "../constants";
import { stakingService } from "./stakingService";

// --- SECURE VAULT STORAGE (Simulated On-Chain State) ---
// This acts as the "Smart Contract" storage slot on the blockchain.
// It is separate from the public ledger (metadata) to ensure financial security.

interface VaultRecord {
  contractId: string;
  lockedBalance: number;
  depositor: string;
  beneficiary: string | null;
  state: 'LOCKED' | 'RELEASED' | 'REFUNDED' | 'DISPUTED';
  createdAt: number;
}

// In-memory storage simulating the blockchain state
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
  },
  {
    id: 'bounty_102',
    title: 'Mars Colony Habitation Module',
    description: 'Detailed interior CAD for a 4-person living unit optimized for low gravity.',
    price: 300,
    client: 'MuskFan_99',
    designer: 'PiUser_Alpha',
    status: BountyStatus.SUBMITTED,
    deadline: Date.now() + 2000000,
    tags: ['Space', 'Interior', 'CAD']
  }
];

// Initialize mock vault for existing bounties
secureVault.set('bounty_101', {
    contractId: 'bounty_101',
    lockedBalance: 150,
    depositor: 'EcoDeveloper_Pi',
    beneficiary: null,
    state: 'LOCKED',
    createdAt: Date.now()
});
secureVault.set('bounty_102', {
    contractId: 'bounty_102',
    lockedBalance: 300,
    depositor: 'MuskFan_99',
    beneficiary: 'PiUser_Alpha',
    state: 'LOCKED', // Still locked until approved
    createdAt: Date.now()
});

export const bountySmartContract = {
  
  /**
   * READ: Get Public Ledger
   */
  getAllBounties: async (): Promise<Bounty[]> => {
    await new Promise(r => setTimeout(r, 400));
    return [...bountyLedger];
  },

  /**
   * READ: Get Vault Status (For verification)
   */
  getEscrowStatus: async (bountyId: string): Promise<string> => {
      const record = secureVault.get(bountyId);
      return record ? record.state : 'UNKNOWN';
  },

  /**
   * TRANSACTION: Initiate Escrow
   * 1. Verifies funds (simulated via Pi SDK before this call)
   * 2. Locks funds in Vault
   * 3. Publishes Bounty to Ledger
   */
  createBounty: async (title: string, description: string, price: number, clientUser: string): Promise<Bounty> => {
    // 1. Validation
    if (price <= 0) throw new Error("Price must be positive");
    if (!title || !description) throw new Error("Invalid payload");

    await new Promise(r => setTimeout(r, 1000));
    
    const newId = `bounty_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    // 2. Lock Funds in Secure Vault
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

    // 3. Update Public Ledger
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

  /**
   * TRANSACTION: Assign Designer
   * Updates the beneficiary potential in the vault.
   */
  claimBounty: async (bountyId: string, designerUser: string): Promise<Bounty> => {
    await new Promise(r => setTimeout(r, 600));
    
    const idx = bountyLedger.findIndex(b => b.id === bountyId);
    const vaultRecord = secureVault.get(bountyId);

    if (idx === -1 || !vaultRecord) throw new Error("Contract not found");
    if (bountyLedger[idx].status !== BountyStatus.OPEN) throw new Error("Contract is not Open");
    if (vaultRecord.state !== 'LOCKED') throw new Error("Escrow Violation: Funds not locked");

    // Update Ledger
    bountyLedger[idx].designer = designerUser;
    bountyLedger[idx].status = BountyStatus.ASSIGNED;

    // Update Vault Beneficiary
    vaultRecord.beneficiary = designerUser;
    secureVault.set(bountyId, vaultRecord);
    
    return bountyLedger[idx];
  },

  /**
   * TRANSACTION: Submit Work
   * State transition only.
   */
  submitWork: async (bountyId: string): Promise<Bounty> => {
    await new Promise(r => setTimeout(r, 600));
    
    const idx = bountyLedger.findIndex(b => b.id === bountyId);
    if (idx === -1) throw new Error("Bounty not found");
    
    // Logic Check
    if (bountyLedger[idx].status !== BountyStatus.ASSIGNED) throw new Error("Invalid State Transition");

    bountyLedger[idx].status = BountyStatus.SUBMITTED;
    return bountyLedger[idx];
  },

  /**
   * CRITICAL TRANSACTION: Release Funds
   * This is the only function capable of moving funds from 'LOCKED' to 'RELEASED'.
   */
  executeContract: async (bountyId: string): Promise<ContractPayout> => {
    await new Promise(r => setTimeout(r, 1500)); 
    
    const idx = bountyLedger.findIndex(b => b.id === bountyId);
    const vaultRecord = secureVault.get(bountyId);

    // 1. Integrity Checks
    if (idx === -1 || !vaultRecord) throw new Error("Critical: Contract Record Missing");
    
    // 2. State Validation
    if (vaultRecord.state !== 'LOCKED') throw new Error("Security Alert: Funds already released or disputed");
    if (bountyLedger[idx].status !== BountyStatus.SUBMITTED) throw new Error("Contract Condition Not Met: Work not submitted");

    // 3. Calculate Payouts & Discounts
    const totalLocked = vaultRecord.lockedBalance;
    const designer = bountyLedger[idx].designer;
    if (!designer) throw new Error("No beneficiary assigned");

    // CHECK FOR STAKING UTILITY (50% Discount on Fees)
    const isStaker = await stakingService.hasActiveStake(designer);
    
    let baseFeeRate = CONTRACT_CONFIG.PLATFORM_COMMISSION_RATE;
    if (isStaker) {
        baseFeeRate = baseFeeRate * CONTRACT_CONFIG.STAKING_DISCOUNT_RATE;
        console.log(`[Smart Contract] 💎 STAKER DETECTED: Fee discounted by ${(CONTRACT_CONFIG.STAKING_DISCOUNT_RATE * 100)}%`);
    }

    const platformFee = totalLocked * baseFeeRate;
    const designerAmount = totalLocked - platformFee;

    // 4. ATOMIC STATE UPDATE
    // Mark vault as released to prevent re-entrancy
    vaultRecord.state = 'RELEASED';
    vaultRecord.lockedBalance = 0;
    secureVault.set(bountyId, vaultRecord);

    // Update Ledger
    bountyLedger[idx].status = BountyStatus.COMPLETED;

    // 5. Emit Event / Logs
    console.log(`[Smart Contract] EXECUTION CONFIRMED: ${bountyId}`);
    console.log(`[Smart Contract] --------------------------------`);
    console.log(`[Smart Contract] Total Released: ${totalLocked} Pi`);
    console.log(`[Smart Contract] To Designer (${designer}): ${designerAmount} Pi`);
    console.log(`[Smart Contract] To Protocol: ${platformFee} Pi`);

    return {
      total: totalLocked,
      platformFee,
      designerAmount,
      timestamp: Date.now(),
      discountApplied: isStaker
    };
  }
};