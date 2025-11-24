
// Enums must be standard enums, not const enums
export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  WALLET = 'WALLET',
  WHITEPAPER = 'WHITEPAPER',
  SETTINGS = 'SETTINGS',
  SCANNER = 'SCANNER',
  BLUEPRINTS = 'BLUEPRINTS'
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

export interface UserSession {
  isAuthenticated: boolean;
  username: string;
  walletAddress: string | null;
  hasTrustline: boolean;
  balance: number;
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
}

// Global Pi SDK Type Definition
declare global {
  interface Window {
    Pi: any;
  }
}
