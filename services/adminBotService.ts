
import { BotLog, BotConfig } from '../types';
import { TOKENOMICS, PAYMENT_CONFIG } from '../constants';

class AdminBotService {
    private logs: BotLog[] = [];
    private isRunning: boolean = false;
    private intervalId: any = null;
    
    // Mock State tracking the immutable config
    private treasuryBalance = TOKENOMICS.distributions.rewardsTreasury;
    private liquidityPoolBalance = TOKENOMICS.distributions.liquidityPool;
    
    // Simulated operational wallets
    private gasTankBalance = 150.0; // XLM/Pi for ops

    public config: BotConfig = {
        maintenanceIntervalMs: 3000, // Speed up for UI demo
        minTreasuryBalance: 300000000, // 300M ARTX threshold
        autoRebalance: true
    };

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.log("SYSTEM", "Bot initialized. Monitoring sequence started.", "SUCCESS");
        
        this.intervalId = setInterval(() => {
            this.runRoutineChecks();
        }, this.config.maintenanceIntervalMs);
    }

    stop() {
        if (!this.isRunning) return;
        this.isRunning = false;
        clearInterval(this.intervalId);
        this.log("SYSTEM", "Bot shutdown sequence complete.", "WARNING");
    }

    private runRoutineChecks() {
        if (!this.isRunning) return;

        // 1. Monitor Treasury Multi-Sig
        this.monitorTreasury();
        
        // 2. Monitor Liquidity Pool
        this.monitorLiquidity();
        
        // 3. Random Maintenance Event (Simulation)
        if (Math.random() > 0.6) {
            this.executeRandomMaintenance();
        }
    }

    private monitorTreasury() {
        // Simulate fluctuating balance (Fees coming in)
        const feeInflow = Math.random() * 500;
        this.treasuryBalance += feeInflow;

        // Log significant milestones
        if (Math.random() > 0.9) {
             this.log("TREASURY", `Verified Balance: ${this.treasuryBalance.toLocaleString()} ARTX. Inflow: +${feeInflow.toFixed(2)}`, "SUCCESS");
        }

        if (this.treasuryBalance < this.config.minTreasuryBalance) {
            this.log("TREASURY", `Low Reserve Warning: ${this.treasuryBalance.toLocaleString()} ARTX`, "WARNING");
        }
    }

    private monitorLiquidity() {
         // Logic to check AMM health
         // Simulate a slight imbalance
         if (this.config.autoRebalance && Math.random() > 0.85) {
             this.log("AMM", "Imbalance > 2% detected. Calculating optimal swap path...", "WARNING");
             
             setTimeout(() => {
                 this.liquidityPoolBalance += 1000; // Mock rebalance effect
                 this.log("AMM", "Auto-Rebalance Executed. Pool Weights Synchronized.", "SUCCESS");
             }, 800);
         }
    }

    private executeRandomMaintenance() {
        const tasks = [
            { type: "ORACLE", desc: "Syncing external price feeds with on-chain aggregators..." },
            { type: "DUST", desc: "Sweeping 0.00451 Pi dust from Service Gateway to Treasury." },
            { type: "GAS", desc: "Operational Wallet Gas check: 150 XLM (Nominal)." },
            { type: "SNAPSHOT", desc: "Archiving hourly ledger state to IPFS..." },
            { type: "SECURITY", desc: "Verifying Multi-Sig Signer Integrity..." }
        ];
        
        const task = tasks[Math.floor(Math.random() * tasks.length)];
        this.log(task.type, task.desc, "SUCCESS");
    }

    private log(action: string, details: string, status: 'SUCCESS' | 'WARNING' | 'ERROR' = 'SUCCESS') {
        const newLog: BotLog = {
            id: Date.now().toString() + Math.random(),
            timestamp: Date.now(),
            action,
            details,
            status
        };
        this.logs.unshift(newLog);
        // Keep log size manageable
        if (this.logs.length > 100) this.logs.pop();
    }

    getLogs() {
        return [...this.logs];
    }
    
    getStatus() {
        return {
            isRunning: this.isRunning,
            treasury: this.treasuryBalance,
            liquidity: this.liquidityPoolBalance
        };
    }
}

export const adminBotService = new AdminBotService();
