
import { ServiceRequest, ContractPayout, Milestone } from "../types";
import { CONTRACT_CONFIG } from "../constants";

// Specialized Vault for "Architex Go" Micro-Services
// Simulates a high-velocity, low-latency Soroban contract

interface ServiceVaultRecord {
    contractId: string; // requestId
    lockedAmount: number;
    remainingBalance: number;
    providerId: string;
    clientId: string;
    status: 'LOCKED' | 'RELEASED' | 'FROZEN' | 'REFUNDED' | 'PARTIALLY_RELEASED' | 'CONFISCATED';
    lockTime: number;
    milestones: Milestone[];
}

const serviceVault = new Map<string, ServiceVaultRecord>();

export const serviceEscrowContract = {
    
    /**
     * TRANSACTION: Lock Funds
     * Triggered when user accepts a bid.
     */
    createEscrow: async (request: ServiceRequest, providerId: string, amount: number): Promise<boolean> => {
        await new Promise(r => setTimeout(r, 1000)); // Network delay

        // Check for Milestones logic if high value
        let milestones: Milestone[] = [];
        if (amount >= 500) {
            // Auto-generate milestones for high value
            milestones = [
                { id: 'ms_1', name: 'Upfront Materials', amount: amount * 0.30, percentage: 30, status: 'LOCKED', requiresClientApproval: true },
                { id: 'ms_2', name: 'Final Completion', amount: amount * 0.70, percentage: 70, status: 'LOCKED', requiresClientApproval: true }
            ];
        }

        const record: ServiceVaultRecord = {
            contractId: request.id,
            lockedAmount: amount,
            remainingBalance: amount,
            providerId: providerId,
            clientId: request.clientId,
            status: 'LOCKED',
            lockTime: Date.now(),
            milestones
        };

        serviceVault.set(request.id, record);
        console.log(`[ServiceEscrow] FUNDS LOCKED: ${amount} Pi for Service ${request.id}. Milestones: ${milestones.length}`);
        return true;
    },

    /**
     * TRANSACTION: Release Milestone
     */
    releaseMilestone: async (requestId: string, milestoneIndex: number): Promise<ContractPayout> => {
        await new Promise(r => setTimeout(r, 1000));
        const record = serviceVault.get(requestId);
        if (!record) throw new Error("Record not found");
        
        if (!record.milestones || !record.milestones[milestoneIndex]) throw new Error("Invalid Milestone");
        const ms = record.milestones[milestoneIndex];

        if (ms.status === 'RELEASED') throw new Error("Milestone already released");
        
        const fee = ms.amount * 0.10;
        const payout = ms.amount - fee;

        // Update State
        ms.status = 'RELEASED';
        record.remainingBalance -= ms.amount;
        
        if (record.remainingBalance <= 0.1) { // Float tolerance
            record.status = 'RELEASED';
        } else {
            record.status = 'PARTIALLY_RELEASED';
        }

        serviceVault.set(requestId, record);
        console.log(`[ServiceEscrow] MILESTONE RELEASE: ${ms.name} - ${payout} Pi to Provider`);

        return {
            total: ms.amount,
            platformFee: fee,
            designerAmount: payout,
            timestamp: Date.now()
        };
    },

    /**
     * TRANSACTION: Release Funds (90/10 Split) - Standard
     * Triggered when User confirms completion for non-milestone jobs.
     */
    releaseFunds: async (requestId: string): Promise<ContractPayout> => {
        await new Promise(r => setTimeout(r, 1500));

        const record = serviceVault.get(requestId);
        if (!record) throw new Error("Escrow record not found");
        
        // If it has milestones, we can't use simple release
        if (record.milestones && record.milestones.length > 0) {
             throw new Error("Use releaseMilestone for this contract");
        }

        if (record.status !== 'LOCKED') throw new Error("Funds not available for release");

        const fee = record.lockedAmount * 0.10; // 10% Fee
        const providerPayout = record.lockedAmount - fee;

        // Atomic Update
        record.status = 'RELEASED';
        record.remainingBalance = 0;
        serviceVault.set(requestId, record);

        console.log(`[ServiceEscrow] RELEASE: ${providerPayout} to ${record.providerId}, ${fee} to Treasury`);

        return {
            total: record.lockedAmount,
            platformFee: fee,
            designerAmount: providerPayout, // Reusing type field
            timestamp: Date.now()
        };
    },

    /**
     * EMERGENCY PROTOCOL: Freeze Funds
     * Triggered by SOS button. Opens arbitration ticket automatically.
     */
    freezeFunds: async (requestId: string): Promise<void> => {
        await new Promise(r => setTimeout(r, 500)); // Fast freeze

        const record = serviceVault.get(requestId);
        if (!record) throw new Error("Escrow record not found");

        if (record.status === 'RELEASED') throw new Error("Too late: Funds already released");

        record.status = 'FROZEN';
        serviceVault.set(requestId, record);

        console.warn(`[ServiceEscrow] ⚠️ SOS PROTOCOL ACTIVATED: Funds Frozen for ${requestId}`);
    },

    /**
     * ARBITRATION: Release to Treasury (Total Forfeiture)
     * Used when a dispute results in a finding of fraud or severe breach by Provider.
     * Funds are confiscated to the DAO Treasury (minus client refund if applicable).
     */
    releaseToTreasury: async (requestId: string, reason: string): Promise<void> => {
        await new Promise(r => setTimeout(r, 1000));
        const record = serviceVault.get(requestId);
        if (!record) throw new Error("Record not found");

        if (record.status !== 'FROZEN' && record.status !== 'LOCKED') throw new Error("Funds must be frozen/locked to confiscate");

        const amount = record.remainingBalance;
        record.remainingBalance = 0;
        record.status = 'CONFISCATED';
        serviceVault.set(requestId, record);

        console.warn(`[ServiceEscrow] ⚖️ DISPUTE RULING: ${amount} Pi CONFISCATED to Treasury. Reason: ${reason}`);
    },

    getStatus: (requestId: string) => {
        return serviceVault.get(requestId)?.status || 'UNKNOWN';
    },

    getMilestones: (requestId: string) => {
        return serviceVault.get(requestId)?.milestones || [];
    }
};
