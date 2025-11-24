
import { TokenomicsConfig, UserSession, DesignAsset } from "../types";
import { TOKENOMICS, CONFIG } from "../constants";

// Represents the compliant headers required by Pi Network distributed backend
const PI_HEADERS = {
  'X-Pi-App-ID': CONFIG.piNetwork.appId,
  'X-Chain-ID': CONFIG.network === 'MAINNET' ? 'Public Global Stellar Network ; September 2015' : 'Test SDF Network ; September 2015',
  'Content-Type': 'application/json',
  'Authorization': 'Bearer [PI_ACCESS_TOKEN_PLACEHOLDER]' // In prod, this is dynamically injected via Pi SDK
};

const DEFAULT_AVATAR = "https://ui-avatars.com/api/?name=Pi+User&background=7928ca&color=fff";
const CURRENT_USER_AVATAR = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150";

// In-memory store for session (Mock DB)
let mockDesigns: DesignAsset[] = [
  {
    id: 'design_alpha_01',
    title: 'Neo-Tokyo Residential Block',
    timestamp: Date.now() - 100000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&q=80&w=600&h=600',
    highResUrl: null, // Locked
    status: 'LOCKED',
    price: 0.50,
    format: 'OBJ',
    author: 'PiUser_Alpha',
    authorAvatar: CURRENT_USER_AVATAR,
    likes: 124,
    views: 450
  }
];

// Mock Community Gallery Data
const mockGallery: DesignAsset[] = [
  {
    id: 'gal_1',
    title: 'Orbital Station Module',
    timestamp: Date.now() - 500000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600&h=600',
    highResUrl: 'mock_url',
    status: 'UNLOCKED',
    price: 1.0,
    format: 'CAD',
    author: 'StellarArchitect',
    authorAvatar: 'https://ui-avatars.com/api/?name=SA&background=00f3ff&color=000',
    likes: 843,
    views: 2100
  },
  {
    id: 'gal_2',
    title: 'Sustainable Eco-Pod',
    timestamp: Date.now() - 800000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=600&h=600',
    highResUrl: 'mock_url',
    status: 'UNLOCKED',
    price: 0.75,
    format: 'PDF',
    author: 'EcoBuilder_Pi',
    authorAvatar: 'https://ui-avatars.com/api/?name=EB&background=10b981&color=fff',
    likes: 562,
    views: 1200
  },
  {
    id: 'gal_3',
    title: 'Cyberpunk Habitation Unit',
    timestamp: Date.now() - 120000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&q=80&w=600&h=600',
    highResUrl: 'mock_url',
    status: 'LOCKED',
    price: 2.0,
    format: 'OBJ',
    author: 'NeonDrifter',
    authorAvatar: 'https://ui-avatars.com/api/?name=ND&background=bc13fe&color=fff',
    likes: 2300,
    views: 5600
  }
];

export const dalGetAccountInfo = async (): Promise<UserSession> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  return {
    isAuthenticated: true,
    username: 'PiUser_Alpha',
    walletAddress: 'G...ARCHITEX_USER',
    hasTrustline: false,
    balance: 0,
    avatarUrl: CURRENT_USER_AVATAR,
    stats: {
        designsCreated: 12,
        likesReceived: 345,
        volumeTraded: 15.5
    }
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
        thumbnailUrl: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&q=80&w=600&h=600',
        highResUrl: null,
        status: 'LOCKED',
        price: 0.50,
        format: 'CAD',
        author: 'PiUser_Alpha',
        authorAvatar: CURRENT_USER_AVATAR,
        likes: 0,
        views: 0
    };
    
    mockDesigns.unshift(newDesign);
    return newDesign;
};

export const dalGetUserDesigns = async (): Promise<DesignAsset[]> => {
    return [...mockDesigns];
};

export const dalGetPublicGallery = async (): Promise<DesignAsset[]> => {
    // Combine mock gallery with user public designs for demo
    return [...mockGallery, ...mockDesigns];
};

export const dalUnlockDesign = async (paymentId: string, designId: string): Promise<DesignAsset | null> => {
    // Simulate Backend Payment Verification and High-Res URL Signing
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
