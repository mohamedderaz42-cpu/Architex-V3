
import { GovernanceProposal, Vote, ProposalStatus } from "../types";
import { trustScoreService } from "./trustScoreService";

/**
 * ARCHITEX DAO GOVERNANCE CONTRACT (SOROBAN SIMULATION)
 * 
 * Enforces the Constitution logic:
 * 1. Quorum: Minimum 30% of Total Voting Power must participate.
 * 2. Pass Threshold: 51% of participating votes must be YES.
 * 3. Execution: Only PASSED proposals can be executed after end time.
 */

const GOVERNANCE_CONSTANTS = {
    QUORUM_PERCENTAGE: 0.30, // 30%
    PASS_THRESHOLD: 0.51,    // 51%
    MIN_PROPOSAL_POWER: 500, // Min Voting Power to create proposal
    VOTING_DURATION_MS: 7 * 24 * 60 * 60 * 1000 // 7 Days
};

// Mock Ledger State
let proposals: GovernanceProposal[] = [
    {
        id: 'prop_genesis_001',
        title: 'Activate Liquidity Mining Program Phase 2',
        description: 'Proposal to allocate 5M ARTX from Treasury to incentivise the ARTX/Pi liquidity pool on the DEX for Q3.',
        proposer: 'CoreDev_Team',
        startTime: Date.now() - 600000000,
        endTime: Date.now() - 100000,
        status: 'PASSED',
        votesFor: 150000,
        votesAgainst: 12000,
        quorumReached: true,
        tags: ['Treasury', 'DeFi']
    },
    {
        id: 'prop_comm_042',
        title: 'Reduce Marketplace Fees to 8%',
        description: 'Community request to lower the standard platform commission from 10% to 8% to attract more volume.',
        proposer: 'EcoBuilder_Pi',
        startTime: Date.now() - 100000000,
        endTime: Date.now() + 500000000, // Active
        status: 'ACTIVE',
        votesFor: 45000,
        votesAgainst: 38000,
        quorumReached: false,
        tags: ['Fees', 'Marketplace']
    }
];

let votes: Vote[] = [];

// Estimated Total Network Power (Mocked)
const NETWORK_TOTAL_POWER = 1000000; 

export const governanceContract = {

    getAllProposals: async (): Promise<GovernanceProposal[]> => {
        await new Promise(r => setTimeout(r, 600));
        return [...proposals].sort((a, b) => b.startTime - a.startTime);
    },

    createProposal: async (title: string, description: string, creatorPower: number, creatorId: string): Promise<GovernanceProposal> => {
        await new Promise(r => setTimeout(r, 1000));
        
        if (creatorPower < GOVERNANCE_CONSTANTS.MIN_PROPOSAL_POWER) {
            throw new Error(`Insufficient Voting Power. Required: ${GOVERNANCE_CONSTANTS.MIN_PROPOSAL_POWER}`);
        }

        const newProposal: GovernanceProposal = {
            id: `prop_${Date.now()}`,
            title,
            description,
            proposer: creatorId,
            startTime: Date.now(),
            endTime: Date.now() + GOVERNANCE_CONSTANTS.VOTING_DURATION_MS,
            status: 'ACTIVE',
            votesFor: 0,
            votesAgainst: 0,
            quorumReached: false,
            tags: ['Community']
        };

        proposals.unshift(newProposal);
        return newProposal;
    },

    castVote: async (proposalId: string, voterId: string, support: boolean, power: number): Promise<GovernanceProposal> => {
        await new Promise(r => setTimeout(r, 800));

        const idx = proposals.findIndex(p => p.id === proposalId);
        if (idx === -1) throw new Error("Proposal not found");
        if (proposals[idx].status !== 'ACTIVE') throw new Error("Voting is closed");
        if (Date.now() > proposals[idx].endTime) throw new Error("Proposal expired");

        // Check if already voted
        const existingVote = votes.find(v => v.proposalId === proposalId && v.voter === voterId);
        if (existingVote) throw new Error("Already voted");

        // Record Vote
        votes.push({
            proposalId,
            voter: voterId,
            support,
            power,
            timestamp: Date.now()
        });

        // Update Proposal State
        if (support) {
            proposals[idx].votesFor += power;
        } else {
            proposals[idx].votesAgainst += power;
        }

        // Check Quorum
        const totalVotes = proposals[idx].votesFor + proposals[idx].votesAgainst;
        if (totalVotes >= (NETWORK_TOTAL_POWER * GOVERNANCE_CONSTANTS.QUORUM_PERCENTAGE)) {
            proposals[idx].quorumReached = true;
        }

        return proposals[idx];
    },

    getConstants: () => GOVERNANCE_CONSTANTS
};
