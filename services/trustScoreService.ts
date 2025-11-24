
import { TrustProfile, UserStats } from "../types";

/**
 * ARCHITEX TRUST SCORE ALGORITHM
 * 
 * Combines on-chain financial behavior with off-chain reputation metadata
 * to generate a tamper-proof "Trust Score" (0-100).
 * 
 * Formula:
 * Score = (Financial * 0.4) + (Reputation * 0.4) + (History * 0.1) + (Legal * 0.1)
 */

const WEIGHTS = {
    FINANCIAL: 0.4,
    REPUTATION: 0.4,
    HISTORY: 0.1,
    LEGAL: 0.1
};

export const trustScoreService = {

    calculateTrustScore: (
        stats: UserStats, 
        accountAgeDays: number, 
        disputesLost: number, 
        stakedAmount: number
    ): TrustProfile => {
        
        // 1. Financial Component (0-100)
        // Based on Volume Traded and Amount Staked
        // Logic: More volume/stake = higher trust (proof of skin in the game)
        const volumeScore = Math.min(100, (stats.volumeTraded / 500) * 100); 
        const stakeScore = Math.min(100, (stakedAmount / 1000) * 100);
        const financial = (volumeScore * 0.6) + (stakeScore * 0.4);

        // 2. Reputation Component (0-100)
        // Based on Likes/Ratings received
        // Simple logic: 100 likes = 100 score cap
        const reputation = Math.min(100, stats.likesReceived);

        // 3. History Component (0-100)
        // Account Age. 1 Year = 100 score.
        const history = Math.min(100, (accountAgeDays / 365) * 100);

        // 4. Legal Component (0-100)
        // Starts at 100, decreases heavily with disputes lost
        const legal = Math.max(0, 100 - (disputesLost * 25));

        // FINAL CALCULATION
        const rawScore = 
            (financial * WEIGHTS.FINANCIAL) +
            (reputation * WEIGHTS.REPUTATION) +
            (history * WEIGHTS.HISTORY) +
            (legal * WEIGHTS.LEGAL);
        
        const finalScore = Math.round(rawScore);

        // Determine Level
        let level: TrustProfile['level'] = 'Novice';
        if (finalScore >= 90) level = 'Authority';
        else if (finalScore >= 70) level = 'Trusted';
        else if (finalScore >= 40) level = 'Associate';

        return {
            score: finalScore,
            level,
            components: {
                financial: Math.round(financial),
                reputation: Math.round(reputation),
                history: Math.round(history),
                legal: Math.round(legal)
            }
        };
    },

    /**
     * Calculates Governance Voting Power
     * Formula: Staked ARTX + (Trust Score * Multiplier)
     */
    calculateVotingPower: (stakedAmount: number, trustScore: number): number => {
        const TRUST_MULTIPLIER = 10; 
        // Example: 500 Staked + (80 Score * 10) = 1300 Voting Power
        return stakedAmount + (trustScore * TRUST_MULTIPLIER);
    }
};
