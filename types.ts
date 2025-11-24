
// Enums must be standard enums, not const enums
export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  WALLET = 'WALLET',
  WHITEPAPER = 'WHITEPAPER',
  SETTINGS = 'SETTINGS',
  SCANNER = 'SCANNER',
  BLUEPRINTS = 'BLUEPRINTS',
  GALLERY = 'GALLERY',
  PROFILE = 'PROFILE',
  ADMIN_LOGIN = 'ADMIN_LOGIN',
  ADMIN_PANEL = 'ADMIN_PANEL'
}

export enum NetworkType {
  TESTNET = 'TESTNET',
  MAINNET = 'MAINNET'
}

export interface TokenomicsConfig {
  tokenId: string;
  maxSupply: number;
  distributions: {
    liquidityPool: number;
    rewardsTreasury: number;
    teamFounders: number;
    strategicReserve: number;
    marketingPartners: number;
  };
  vestingRules: {
    [key: string]: string;
  };
}

export interface UserStats {
  designsCreated: number;
  likesReceived: number;
  volumeTraded: number;
}

export interface UserSession {
  isAuthenticated: boolean;
  username: string;
  walletAddress: string | null;
  hasTrustline: boolean;
  balance: number;
  avatarUrl: string;
  stats: UserStats;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isThinking?: boolean;
}

export interface AppConfig {
  network: NetworkType;
  contracts: {
    vestingVault: string;
    centralBank: string;
    amm: string;
  };
  piNetwork: {
    appId: string;
    backendUrl: string;
  };
}

// Payment & Asset Logic
export type AssetStatus = 'GENERATING' | 'LOCKED' | 'UNLOCKED';

export interface DesignAsset {
  id: string;
  title: string;
  timestamp: number;
  thumbnailUrl: string; // Always visible
  highResUrl: string | null; // Null if locked
  status: AssetStatus;
  price: number;
  format: 'OBJ' | 'CAD' | 'PDF';
  // Identity & Social
  author: string;
  authorAvatar: string;
  likes: number;
  views: number;
}

// Admin & Analytics
export interface AdminSession {
  isAuthenticated: boolean;
  token: string;
}

export interface ApiUsageStats {
  providerId: string;
  providerName: string;
  totalRequests: number;
  totalTokens: number;
  errorRate: number; // Percentage 0-100
  avgLatency: number; // ms
  costEstimate: number; // USD
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  history: { time: string; requests: number; latency: number }[];
}

// Global Pi SDK Type Definition
declare global {
  interface Window {
    Pi: any;
  }
}