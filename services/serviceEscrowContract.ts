
import { ServiceRequest, ContractPayout } from "../types";
import { CONTRACT_CONFIG } from "../constants";

// Specialized Vault for "Architex Go" Micro-Services
// Simulates a high-velocity, low-latency Soroban contract

interface ServiceVaultRecord {
    contractId: string; // requestId
    lockedAmount: number;
    providerId: string;
    clientId: string;
    status: 'LOCKED' | 'RELEASED' | 'FROZEN' | 'REFUNDED';
    lockTime: number;
}

const serviceVault = new Map<string, ServiceVaultRecord>();

export const serviceEscrowContract = {
    
    /**
     * TRANSACTION: Lock Funds
     * Triggered when user accepts a bid.
     */
    createEscrow: async (request: ServiceRequest, providerId: string, amount: number): Promise<boolean> => {
        await new Promise(r => setTimeout(r, 1000)); // Network delay

        const record: ServiceVaultRecord = {
            contractId: request.id,
            lockedAmount: amount,
            providerId: providerId,
            clientId: request.clientId,
            status: 'LOCKED',
            lockTime: Date.now()
        };

        serviceVault.set(request.id, record);
        console.log(`[ServiceEscrow] FUNDS LOCKED: ${amount} Pi for Service ${request.id}`);
        return true;
    },

    /**
     * TRANSACTION: Release Funds (90/10 Split)
     * Triggered when User confirms completion.
     */
    releaseFunds: async (requestId: string): Promise<ContractPayout> => {
        await new Promise(r => setTimeout(r, 1500));

        const record = serviceVault.get(requestId);
        if (!record) throw new Error("Escrow record not found");
        if (record.status !== 'LOCKED') throw new Error("Funds not available for release");

        const fee = record.lockedAmount * 0.10; // 10% Fee
        const providerPayout = record.lockedAmount - fee;

        // Atomic Update
        record.status = 'RELEASED';
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

    getStatus: (requestId: string) => {
        return serviceVault.get(requestId)?.status || 'UNKNOWN';
    }
};
