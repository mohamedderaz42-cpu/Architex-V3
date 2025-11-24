
import { TokenomicsConfig, UserSession, DesignAsset } from "../types";
import { TOKENOMICS, CONFIG } from "../constants";

// Represents the compliant headers required by Pi Network distributed backend
const PI_HEADERS = {
  'X-Pi-App-ID': CONFIG.piNetwork.appId,
  'X-Chain-ID': CONFIG.network === 'MAINNET' ? 'Public Global Stellar Network ; September 2015' : 'Test SDF Network ; September 2015',
  'Content-Type': 'application/json',
  'Authorization': 'Bearer [PI_ACCESS_TOKEN_PLACEHOLDER]' // In prod, this is dynamically injected via Pi SDK
};

// In-memory store for session (Mock DB)
let mockDesigns: DesignAsset[] = [
  {
    id: 'design_alpha_01',
    title: 'Neo-Tokyo Residential Block',
    timestamp: Date.now() - 100000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&q=80&w=300&h=300', // Low res placeholder
    highResUrl: null, // Locked
    status: 'LOCKED',
    price: 0.50,
    format: 'OBJ'
  }
];

export const dalGetAccountInfo = async (): Promise<UserSession> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  return {
    isAuthenticated: true,
    username: 'PiUser_Alpha',
    walletAddress: 'G...ARCHITEX_USER',
    hasTrustline: false,
    balance: 0
  };
};

export const dalCreateTrustline = async (tokenId: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  return true;
};

export const dalGetLiveTokenStats = async (): Promise<TokenomicsConfig> => {
  return TOKENOMICS;
};

// --- Design / Monetization Methods ---

export const dalGenerateBlueprint = async (scanData: any): Promise<DesignAsset> => {
    // Simulate AI Generation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newDesign: DesignAsset = {
        id: `design_${Date.now()}`,
        title: 'Generative Structural Analysis #42',
        timestamp: Date.now(),
        thumbnailUrl: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&q=80&w=300&h=300',
        highResUrl: null,
        status: 'LOCKED',
        price: 0.50,
        format: 'CAD'
    };
    
    mockDesigns.unshift(newDesign);
    return newDesign;
};

export const dalGetUserDesigns = async (): Promise<DesignAsset[]> => {
    return [...mockDesigns];
};

export const dalUnlockDesign = async (paymentId: string, designId: string): Promise<DesignAsset | null> => {
    // Simulate Backend Payment Verification and High-Res URL Signing
    // console.log(`[DAL] Verifying Payment ${paymentId} for Asset ${designId}`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const designIndex = mockDesigns.findIndex(d => d.id === designId);
    if (designIndex > -1) {
        mockDesigns[designIndex] = {
            ...mockDesigns[designIndex],
            status: 'UNLOCKED',
            highResUrl: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&q=80&w=1920&h=1080' // Unlocked High Res
        };
        return mockDesigns[designIndex];
    }
    return null;
};
