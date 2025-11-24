
import { FuzzTestResult } from "../types";
import { stakingService } from "./stakingService";
import { bountySmartContract } from "./bountySmartContract";
import { nftContractService } from "./nftContractService";
import { STAKING_CONFIG } from "../constants";

/**
 * ARCHITEX FUZZ TESTING ENGINE
 * 
 * Simulates high-velocity random inputs against the Soroban Smart Contract logic layers
 * to identify edge cases, potential panics, or logical vulnerabilities.
 */

// Random Data Generators
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number) => Math.random() * (max - min) + min;
const randomString = (len: number) => Math.random().toString(36).substring(2, 2 + len);

const VECTORS = {
    NEGATIVE_NUMBERS: [-1, -100, -0.0000001, Number.MIN_SAFE_INTEGER],
    HUGE_NUMBERS: [Number.MAX_SAFE_INTEGER, 1000000000000, Infinity],
    MALFORMED_STRINGS: ["", "   ", "\u0000", "<script>alert(1)</script>", "DROP TABLE bounties;"],
    INVALID_IDS: ["null", "undefined", "NaN", "0x0"]
};

class FuzzTestingService {
    
    private async executeTest(
        contract: 'STAKING' | 'BOUNTY' | 'NFT',
        fnName: string,
        inputLabel: string,
        operation: () => Promise<any>
    ): Promise<FuzzTestResult> {
        const start = performance.now();
        let status: 'PASS' | 'FAIL' | 'VULNERABILITY' = 'PASS';
        let details = "Execution successful or Error Handled Gracefully";

        try {
            await operation();
            // If operation succeeds with invalid input (e.g. staking negative amount), it's a vulnerability
            if (inputLabel.includes("NEGATIVE") || inputLabel.includes("INVALID")) {
                status = 'VULNERABILITY';
                details = "Contract accepted invalid input without reversion.";
            } else {
                status = 'PASS';
                details = "Transaction Executed Successfully";
            }
        } catch (e: any) {
            // If it throws an error, that's usually good for fuzzing invalid inputs
            // We only care if it threw a "System Error" or crashed vs a logic error
            const msg = e.message || e.toString();
            if (msg.includes("Insufficient") || msg.includes("not found") || msg.includes("locked") || msg.includes("invalid")) {
                status = 'PASS';
                details = `Reverted as expected: ${msg}`;
            } else {
                status = 'FAIL';
                details = `Unexpected Panic: ${msg}`;
            }
        }

        return {
            id: `test_${Date.now()}_${randomString(5)}`,
            timestamp: Date.now(),
            targetContract: contract,
            functionName: fnName,
            inputVector: inputLabel,
            status,
            details,
            latencyMs: Math.round(performance.now() - start)
        };
    }

    // --- CAMPAIGNS ---

    public async fuzzStakingContract(iterations: number, onResult: (res: FuzzTestResult) => void) {
        const poolIds = STAKING_CONFIG.POOLS.map(p => p.id).concat(VECTORS.INVALID_IDS);

        for (let i = 0; i < iterations; i++) {
            const poolId = poolIds[randomInt(0, poolIds.length - 1)];
            
            // Scenario 1: Stake Random Amounts
            let amount = Math.random() > 0.5 
                ? randomFloat(0.1, 1000) 
                : VECTORS.NEGATIVE_NUMBERS[randomInt(0, VECTORS.NEGATIVE_NUMBERS.length - 1)];

            const res = await this.executeTest(
                'STAKING', 
                'stakeTokens', 
                `Pool: ${poolId}, Amount: ${amount}`,
                () => stakingService.stakeTokens(poolId, amount)
            );
            onResult(res);

            // Scenario 2: Unstake Random
            const res2 = await this.executeTest(
                'STAKING',
                'unstakeTokens',
                `Pool: ${poolId} (Random Unstake)`,
                () => stakingService.unstakeTokens(poolId)
            );
            onResult(res2);
            
            // Tiny delay to not freeze UI completely
            await new Promise(r => setTimeout(r, 50)); 
        }
    }

    public async fuzzBountyContract(iterations: number, onResult: (res: FuzzTestResult) => void) {
        for (let i = 0; i < iterations; i++) {
            const title = Math.random() > 0.8 ? VECTORS.MALFORMED_STRINGS[0] : `Fuzz Bounty ${randomString(5)}`;
            const price = Math.random() > 0.8 ? -500 : randomInt(10, 5000);

            const res = await this.executeTest(
                'BOUNTY',
                'createBounty',
                `Title: "${title}", Price: ${price}`,
                () => bountySmartContract.createBounty(title, "Fuzz Desc", price, "FuzzUser")
            );
            onResult(res);
            await new Promise(r => setTimeout(r, 50)); 
        }
    }

    public async fuzzNFTContract(iterations: number, onResult: (res: FuzzTestResult) => void) {
         for (let i = 0; i < iterations; i++) {
            // Mock Design Asset
            const mockAsset: any = {
                id: `fuzz_${randomString(5)}`,
                title: Math.random() > 0.9 ? "" : "Valid Title",
                format: "OBJ"
            };
            
            // Fuzz Eligibility
            const balance = Math.random() > 0.5 ? 0 : 10000;
            const res = await this.executeTest(
                'NFT',
                'mintDesignAsNFT',
                `Mint with Balance: ${balance}`,
                async () => {
                     const elig = await nftContractService.checkEligibility("FUZZ_USER", balance);
                     if (!elig.eligible) throw new Error(elig.reason);
                     return nftContractService.mintDesignAsNFT(mockAsset, "FUZZ_USER");
                }
            );
            onResult(res);
            await new Promise(r => setTimeout(r, 50)); 
         }
    }
}

export const fuzzTestingService = new FuzzTestingService();
