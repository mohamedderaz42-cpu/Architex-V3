import { Bounty, BountyStatus, ContractPayout } from "../types";
import { CONTRACT_CONFIG } from "../constants";

// This service acts as the Smart Contract Logic Layer for the Pi App.
// In a fully decentralized Pi App, this logic would verify against the Pi Blockchain transaction metadata.

let bountyLedger: Bounty[] = [
  {
    id: 'bounty_101',
    title: 'Futuristic Eco-Skyscraper Concept',
    description: 'Need a 50-story residential tower concept using biomimicry. Must include vertical gardens.',
    price: 150,
    client: 'EcoDeveloper_Pi',
    designer: null,
    status: BountyStatus.OPEN,
    deadline: Date.now() + 604800000, // 1 week
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

export const bountySmartContract = {
  
  /**
   * Reads the current state of the ledger
   */
  getAllBounties: async (): Promise<Bounty[]> => {
    // Simulate Chain Read Latency
    await new Promise(r => setTimeout(r, 400));
    return [...bountyLedger];
  },

  /**
   * INIT: Client creates a bounty. 
   * Funds are technically 'Approved' via Pi SDK before this is called.
   */
  createBounty: async (title: string, description: string, price: number, clientUser: string): Promise<Bounty> => {
    await new Promise(r => setTimeout(r, 1000));
    
    const newBounty: Bounty = {
      id: `bounty_${Date.now()}`,
      title,
      description,
      price,
      client: clientUser,
      designer: null,
      status: BountyStatus.OPEN,
      deadline: Date.now() + (7 * 24 * 60 * 60 * 1000), // Default 7 days
      tags: ['Custom']
    };
    
    bountyLedger.unshift(newBounty);
    return newBounty;
  },

  /**
   * CLAIM: Designer takes the job.
   */
  claimBounty: async (bountyId: string, designerUser: string): Promise<Bounty> => {
    await new Promise(r => setTimeout(r, 600));
    const idx = bountyLedger.findIndex(b => b.id === bountyId);
    
    if (idx === -1) throw new Error("Bounty not found");
    if (bountyLedger[idx].status !== BountyStatus.OPEN) throw new Error("Contract is not Open");

    bountyLedger[idx].designer = designerUser;
    bountyLedger[idx].status = BountyStatus.ASSIGNED;
    
    return bountyLedger[idx];
  },

  /**
   * SUBMIT: Designer uploads proof of work.
   */
  submitWork: async (bountyId: string): Promise<Bounty> => {
    await new Promise(r => setTimeout(r, 600));
    const idx = bountyLedger.findIndex(b => b.id === bountyId);
    
    if (idx === -1) throw new Error("Bounty not found");
    if (bountyLedger[idx].status !== BountyStatus.ASSIGNED) throw new Error("Contract invalid state");

    bountyLedger[idx].status = BountyStatus.SUBMITTED;
    return bountyLedger[idx];
  },

  /**
   * EXECUTE: Client approves work. Smart Contract distributes Pi.
   * Logic: 90% to Designer, 10% to Architex Protocol.
   */
  executeContract: async (bountyId: string): Promise<ContractPayout> => {
    await new Promise(r => setTimeout(r, 1500)); // Simulate Processing
    const idx = bountyLedger.findIndex(b => b.id === bountyId);
    
    if (idx === -1) throw new Error("Bounty not found");
    const contract = bountyLedger[idx];

    if (contract.status !== BountyStatus.SUBMITTED) throw new Error("Work not yet submitted");

    // COMMISSION LOGIC
    const feeRate = CONTRACT_CONFIG.PLATFORM_COMMISSION_RATE; // 0.10
    const platformFee = contract.price * feeRate;
    const designerAmount = contract.price - platformFee;

    // Update State
    bountyLedger[idx].status = BountyStatus.COMPLETED;

    console.log(`[Smart Contract] Executing Payout for ${contract.id}`);
    console.log(`[Smart Contract] Total Locked: ${contract.price} Pi`);
    console.log(`[Smart Contract] Platform Commission (10%): ${platformFee} Pi -> ${CONTRACT_CONFIG.ESCROW_WALLET}`);
    console.log(`[Smart Contract] Designer Payout (90%): ${designerAmount} Pi -> ${contract.designer}`);

    return {
      total: contract.price,
      platformFee: platformFee,
      designerAmount: designerAmount,
      timestamp: Date.now()
    };
  }
};