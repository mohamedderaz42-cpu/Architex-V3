
import { ArbitratorProfile, Dispute } from "../types";

/**
 * ARCHITEX CONFLICT RESOLUTION ENGINE
 * 
 * Ensures neutrality in the Arbitrator Marketplace by analyzing past interactions
 * to detect Conflicts of Interest (COI) before assigning cases.
 */

// Mock History of Interactions (Transactions, Previous Disputes, Social Graph)
interface InteractionRecord {
    parties: string[];
    type: 'TRANSACTION' | 'PREVIOUS_RULING' | 'SOCIAL_CONNECTION' | 'AFFILIATE';
    timestamp: number;
}

const interactionGraph: InteractionRecord[] = [
    { parties: ['arb_1', 'EcoDeveloper_Pi'], type: 'PREVIOUS_RULING', timestamp: Date.now() - 10000000 },
    { parties: ['arb_2', 'PiUser_Alpha'], type: 'TRANSACTION', timestamp: Date.now() - 500000 },
    { parties: ['arb_3', 'MuskFan_99'], type: 'SOCIAL_CONNECTION', timestamp: Date.now() - 99999999 }
];

class ConflictResolutionService {

    /**
     * COI ALGORITHM
     * Returns true if a conflict exists between the arbitrator and EITHER party in the dispute.
     */
    checkConflictOfInterest(arbitratorId: string, partyA: string, partyB: string): boolean {
        // 1. Direct Check
        const directConflict = interactionGraph.some(record => {
            const involvesArb = record.parties.includes(arbitratorId);
            const involvesA = record.parties.includes(partyA);
            const involvesB = record.parties.includes(partyB);
            
            // Conflict if Arb matched with either party
            return involvesArb && (involvesA || involvesB);
        });

        if (directConflict) {
            console.log(`[COI-ALGO] Conflict Detected for Arbitrator ${arbitratorId}`);
            return true;
        }

        // 2. Implicit/Derived Checks (Mocked)
        // e.g., checking wallet depth or shared IP logic would go here
        
        return false;
    }

    /**
     * Auto-Match Logic
     * Finds the best available arbitrator based on:
     * 1. No Conflicts
     * 2. Reputation Score (High to Low)
     * 3. Specialty Match
     */
    findEligibleArbitrators(dispute: Dispute, availableArbitrators: ArbitratorProfile[]): ArbitratorProfile[] {
        return availableArbitrators.filter(arb => {
            // Check COI
            const hasConflict = this.checkConflictOfInterest(arb.id, dispute.initiator, dispute.respondent);
            if (hasConflict) return false;

            // Reputation Threshold
            if (arb.reputationScore < 80) return false;

            return true;
        }).sort((a, b) => b.reputationScore - a.reputationScore);
    }

    /**
     * Calculates the "Trust Score" of a verdict based on Arbitrator Reputation
     */
    calculateVerdictWeight(arbitrator: ArbitratorProfile): number {
        return arbitrator.reputationScore / 100;
    }
}

export const conflictResolutionService = new ConflictResolutionService();
