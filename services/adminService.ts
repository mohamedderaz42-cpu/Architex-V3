import { ApiUsageStats } from "../types";
import { AI_CONFIG } from "../ai_provider_config";

// Mock Admin Credentials
const ADMIN_SECRET = "admin123";
const MFA_CODE = "123456";

export const adminAuth = {
  login: async (password: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network
    return password === ADMIN_SECRET;
  },

  requestMFA: async (): Promise<boolean> => {
    // In a real app, this would trigger an SMS/Email via backend
    console.log(`[AdminService] MFA Code Sent: ${MFA_CODE}`);
    alert(`[DEV MODE] Your Admin MFA Code is: ${MFA_CODE}`);
    return true;
  },

  verifyMFA: async (code: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    return code === MFA_CODE;
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