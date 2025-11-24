

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
  ADMIN_PANEL = 'ADMIN_PANEL',
  MESSAGES = 'MESSAGES',
  DEFI = 'DEFI',
  BOUNTIES = 'BOUNTIES',
  NFT_FACTORY = 'NFT_FACTORY'
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

// Contextual Messaging Types
export type MessageSender = 'user' | 'support' | 'system';

export interface ContextualMessage {
  id: string;
  sender: MessageSender;
  text: string;
  timestamp: number;
  contextId: string;
  isRead: boolean;
}

export interface Conversation {
  contextId: string; // designId or orderId
  contextType: 'DESIGN' | 'ORDER' | 'SUPPORT';
  title: string;
  lastMessage: string;
  lastTimestamp: number;
  unreadCount: number;
  thumbnailUrl?: string;
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
export type AssetStatus = 'GENERATING' | 'LOCKED' | 'UNLOCKED' | 'MINTED';

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
  nftId?: string; // If minted
}

export interface NFTMetadata {
  tokenId: string;
  name: string;
  description: string;
  image: string;
  attributes: { trait_type: string; value: string }[];
  mintTime: number;
  owner: string;
  royalty: number; // Percentage
}

// Bounty Marketplace Types
export enum BountyStatus {
  OPEN = 'OPEN',           // Created, Funds Escrowed
  ASSIGNED = 'ASSIGNED',   // Designer selected
  SUBMITTED = 'SUBMITTED', // Work uploaded for review
  COMPLETED = 'COMPLETED', // Approved, Funds Released
  DISPUTED = 'DISPUTED'
}

export interface Bounty {
  id: string;
  title: string;
  description: string;
  price: number; // In Pi
  client: string; // Username
  designer: string | null; // Username
  status: BountyStatus;
  deadline: number;
  tags: string[];
}

export interface ContractPayout {
  total: number;
  platformFee: number;
  designerAmount: number;
  timestamp: number;
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

// DeFi Types
export interface OrderBookEntry {
  price: string;
  amount: string;
  total: number;
}

export interface OrderBookData {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  spread: string;
}

export interface ChainBalance {
  assetCode: string;
  balance: string;
  issuer?: string;
}

// Global Pi SDK Type Definition
declare global {
  interface Window {
    Pi: any;
  }
}