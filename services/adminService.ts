
import { ApiUsageStats, SystemMode, AuditReport } from "../types";
import { AI_CONFIG } from "../ai_provider_config";

// Mock Admin Credentials
const ADMIN_SECRET = "admin123";
const MFA_CODE = "123456";

// System State
let currentMode: SystemMode = 'BETA'; // Start in Beta for safety
let whitelist = new Set<string>(['PiUser_Alpha', 'EcoDeveloper_Pi']); // Default allowed users
let auditReports: AuditReport[] = [
    {
        id: 'audit_certik_001',
        firmName: 'CertiK',
        auditDate: Date.now() - 864000000,
        scope: 'Soroban Smart Contracts (Staking, Bounty)',
        status: 'PASSED_WITH_WARNINGS',
        reportHash: 'QmXyZ...report_v1',
        criticalIssuesFound: 2,
        resolvedIssues: 2
    }
];

export const adminAuth = {
  login: async (password: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network
    return password === ADMIN_SECRET;
  },

  requestMFA: async (): Promise<boolean> => {
    console.log(`[AdminService] MFA Code Sent: ${MFA_CODE}`);
    alert(`[DEV MODE] Your Admin MFA Code is: ${MFA_CODE}`);
    return true;
  },

  verifyMFA: async (code: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    return code === MFA_CODE;
  }
};

export const systemConfigService = {
    getSystemMode: async (): Promise<SystemMode> => {
        await new Promise(r => setTimeout(r, 200));
        return currentMode;
    },

    setSystemMode: async (mode: SystemMode): Promise<void> => {
        currentMode = mode;
    },

    isUserWhitelisted: async (username: string): Promise<boolean> => {
        // In real app, this checks DB
        return whitelist.has(username);
    },

    addToWhitelist: async (username: string): Promise<void> => {
        whitelist.add(username);
    },

    removeFromWhitelist: async (username: string): Promise<void> => {
        whitelist.delete(username);
    },

    getWhitelist: async (): Promise<string[]> => {
        return Array.from(whitelist);
    },

    // Audit Management
    getAuditReports: async (): Promise<AuditReport[]> => {
        return [...auditReports];
    },

    submitAuditReport: async (report: AuditReport): Promise<void> => {
        auditReports.unshift(report);
    }
};

export const getSystemTelemetry = async (): Promise<ApiUsageStats[]> => {
  // Generate mock data for the dashboard based on AI_CONFIG providers
  const providers = Object.values(AI_CONFIG.providers);
  
  return providers.map(provider => {
    const isGemini = provider.id === 'GEMINI';
    
    // Generate some random history data
    const history = Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      requests: Math.floor(Math.random() * (isGemini ? 500 : 100)) + 50,
      latency: Math.floor(Math.random() * (isGemini ? 200 : 800)) + 100
    }));

    const totalRequests = history.reduce((acc, curr) => acc + curr.requests, 0);
    
    return {
      providerId: provider.id,
      providerName: provider.name,
      totalRequests: totalRequests,
      totalTokens: totalRequests * (Math.floor(Math.random() * 500) + 100),
      errorRate: isGemini ? 0.05 : 2.1,
      avgLatency: isGemini ? 350 : 1200,
      costEstimate: isGemini ? totalRequests * 0.00001 : totalRequests * 0.0005, // Gemini Flash is cheaper
      status: isGemini ? 'ONLINE' : 'DEGRADED',
      history
    };
  });
};