
import { StressMetrics } from "../types";

class StressTestService {
    private isRunning = false;
    private metrics: StressMetrics = {
        activeUsers: 0,
        transactionsPerSecond: 0,
        avgLatencyMs: 45,
        errorRate: 0,
        cpuUsage: 12,
        memoryUsage: 24
    };
    private targetUserCount = 0;
    private intervalId: any = null;

    startTest(userCount: number) {
        if (this.isRunning) return;
        this.isRunning = true;
        this.targetUserCount = userCount;
        this.metrics.activeUsers = 0;
        
        // Start simulation loop
        this.intervalId = setInterval(() => {
            this.simulateTick();
        }, 1000);
    }

    stopTest() {
        this.isRunning = false;
        this.targetUserCount = 0;
        clearInterval(this.intervalId);
        // Ramp down
        this.metrics = {
            activeUsers: 0,
            transactionsPerSecond: 0,
            avgLatencyMs: 45,
            errorRate: 0,
            cpuUsage: 12,
            memoryUsage: 24
        };
    }

    getMetrics(): StressMetrics {
        return { ...this.metrics };
    }

    private simulateTick() {
        // Ramp up users
        if (this.metrics.activeUsers < this.targetUserCount) {
            const rampRate = Math.max(10, Math.floor(this.targetUserCount * 0.1));
            this.metrics.activeUsers = Math.min(this.targetUserCount, this.metrics.activeUsers + rampRate);
        }

        // Simulate Load Effects
        const loadFactor = this.metrics.activeUsers / 50000; // Normalized load (assuming 50k max)
        
        // TPS scales with users but saturates
        this.metrics.transactionsPerSecond = Math.floor(this.metrics.activeUsers * (Math.random() * 0.2 + 0.1));
        
        // Latency increases exponentially with load
        const baseLatency = 45;
        const noise = Math.random() * 20 - 10;
        this.metrics.avgLatencyMs = Math.floor(baseLatency + (loadFactor * loadFactor * 500) + noise);

        // Error rate spikes if load is high
        if (loadFactor > 0.8) {
            this.metrics.errorRate = Math.min(100, (loadFactor - 0.8) * 20 + (Math.random() * 2));
        } else {
            this.metrics.errorRate = Math.max(0, Math.random() * 0.1);
        }

        // Resource Usage
        this.metrics.cpuUsage = Math.min(100, 10 + (loadFactor * 80) + (Math.random() * 5));
        this.metrics.memoryUsage = Math.min(100, 20 + (loadFactor * 60) + (Math.random() * 2));
    }
}

export const stressTestService = new StressTestService();
