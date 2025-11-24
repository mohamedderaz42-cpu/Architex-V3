

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
  NFT_FACTORY = 'NFT_FACTORY',
  STAKING = 'STAKING',
  LEGAL = 'LEGAL',
  VENDOR_PORTAL = 'VENDOR_PORTAL',
  INVENTORY = 'INVENTORY',
  SHIPPING = 'SHIPPING',
  CART = 'CART',
  SERVICES = 'SERVICES',
  DISPUTES = 'DISPUTES',
  GOVERNANCE = 'GOVERNANCE' // New: DAO Governance
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

export type UserTier = 'FREE' | 'PRO' | 'ACCELERATOR';

export interface TrustProfile {
  score: number; // 0-100
  level: 'Novice' | 'Associate' | 'Trusted' | 'Authority';
  components: {
    financial: number; // Based on volume/staking
    reputation: number; // Based on ratings
    history: number; // Account age/activity
    legal: number; // Dispute outcome history
  };
}

export interface UserSession {
  isAuthenticated: boolean;
  username: string;
  walletAddress: string | null;
  hasTrustline: boolean;
  balance: number;
  avatarUrl: string;
  stats: UserStats;
  tier: UserTier;
  role?: 'USER' | 'PROVIDER' | 'ARBITRATOR';
  trustProfile?: TrustProfile;
  votingPower?: number; // Calculated: Staked + (TrustScore * Multiplier)
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

export interface InstallationProof {
  status: 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  imageUrl?: string;
  timestamp?: number;
  rewardAmount?: number;
}

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
  // Real World Verification
  installationProof?: InstallationProof;
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

// Vendor Portal Types
export type VendorStatus = 'NOT_APPLIED' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface VendorApplication {
    companyName: string;
    taxId: string;
    contactEmail: string;
    status: VendorStatus;
    insuranceDoc?: {
        fileName: string;
        uploadedAt: number;
        verified: boolean;
    };
    submittedAt?: number;
}

// Inventory & Logistics Types
export interface InventoryItem {
    id: string;
    sku: string;
    name: string;
    category: 'MATERIAL' | 'KIT' | 'TOOL' | 'MERCH';
    quantity: number;
    unitPrice: number; // In Pi
    location: string;
    lowStockThreshold: number;
    lastUpdated: number;
}

export interface LedgerEntry {
    id: string;
    itemId: string;
    itemName: string;
    type: 'INBOUND' | 'OUTBOUND' | 'ADJUSTMENT';
    quantity: number;
    timestamp: number;
    reason: string;
    performedBy: string;
}

export interface ShippingZone {
    id: string;
    name: string;
    regions: string[]; // Countries or States
    baseRate: number; // Pi
    incrementalRate: number; // Pi per unit/kg
    estimatedDeliveryDays: string;
    isActive: boolean;
}

// Order Management Types
export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED';

export interface Order {
    id: string;
    customerId: string;
    customerName: string; // Derived/Mocked
    items: CartItem[];
    total: number;
    status: OrderStatus;
    timestamp: number;
    shippingAddress: string;
    trackingNumber?: string;
    payoutStatus?: 'ESCROWED' | 'RELEASED'; // Status of funds
}

// Smart Cart Types
export interface CartItem extends InventoryItem {
    cartQuantity: number;
}

export interface SmartSuggestion {
    id: string;
    type: 'ALTERNATIVE' | 'BUNDLE';
    originalItemId?: string; // If swapping
    suggestedItem: InventoryItem;
    message: string;
    savingsAmount: number; // In Pi
    savingsPercent: number;
}

export interface CheckoutResult {
    success: boolean;
    orderId?: string;
    conflict?: {
        conflictingItemId: string;
        itemName: string;
        availableQuantity: number;
        requestedQuantity: number;
        resolutionSuggestion?: SmartSuggestion; // The AI swap suggestion
    };
}

// Bounty Marketplace Types
export enum BountyStatus {
  OPEN = 'OPEN',           // Created, Funds Escrowed
  ASSIGNED = 'ASSIGNED',   // Designer selected
  SUBMITTED = 'SUBMITTED', // Work uploaded for review
  COMPLETED = 'COMPLETED', // Approved, Funds Released
  DISPUTED = 'DISPUTED'    // New: Dispute Raised
}

export interface Bounty {
  id: string;
  title: string;
  description: string;
  price: number; // In Pi
  client: string; // Username
  designer: string | null; // Username (or Service Provider)
  status: BountyStatus;
  deadline: number;
  tags: string[];
  type?: 'DESIGN' | 'SERVICE'; // New: Differentiate between design work and physical services
  disputeId?: string; // Link to active dispute
}

export interface ContractPayout {
  total: number;
  platformFee: number;
  designerAmount: number;
  timestamp: number;
  discountApplied?: boolean;
}

// Service & Arbitration Types (New)

export interface Certification {
    name: string;
    issuer: string;
    date: number;
    verified: boolean;
}

export interface ServiceProviderProfile {
    id: string;
    username: string;
    role: 'CONTRACTOR' | 'TECHNICIAN' | 'ARCHITECT';
    displayName: string;
    avatarUrl: string;
    reputationScore: number; // 0-100 unforgeable rating
    verifiedId: boolean;
    certifications: Certification[];
    hourlyRate: number;
    location: string;
    available: boolean;
}

export interface ArbitratorProfile {
    id: string;
    username: string;
    displayName: string;
    specialty: 'CONSTRUCTION' | 'IP_RIGHTS' | 'FINANCIAL';
    casesSolved: number;
    reputationScore: number; // High reputation required
    feePerCase: number;
}

export interface Dispute {
    id: string;
    bountyId: string;
    initiator: string;
    respondent: string;
    reason: string;
    status: 'OPEN' | 'ARBITRATION' | 'RESOLVED';
    arbitratorId: string | null;
    evidence: {
        submittedBy: string;
        text: string;
        timestamp: number;
    }[];
    ruling?: {
        winner: string;
        splitPercentage: number; // e.g., 100 to winner, 0 to loser, or 50/50
        reason: string;
        timestamp: number;
    };
    createdAt: number;
}

// Staking Types
export interface StakingPool {
  id: string;
  name: string;
  description: string;
  apy: number; // Percentage
  lockPeriodDays: number; // 0 for flexible
  minStake: number;
  totalStaked: number; // Global TVL
}

export interface UserStake {
  poolId: string;
  amount: number;
  startTime: number;
  lastClaimTime: number;
  unclaimedRewards: number;
}

// Governance Types
export type ProposalStatus = 'ACTIVE' | 'PASSED' | 'REJECTED' | 'EXECUTED';

export interface GovernanceProposal {
    id: string;
    title: string;
    description: string;
    proposer: string;
    startTime: number;
    endTime: number;
    status: ProposalStatus;
    votesFor: number;
    votesAgainst: number;
    quorumReached: boolean;
    tags: string[];
}

export interface Vote {
    proposalId: string;
    voter: string;
    support: boolean;
    power: number;
    timestamp: number;
}

// Oracle Types
export interface OracleQuote {
  pair: string; // e.g., 'ARTX/Pi'
  rate: number;
  timestamp: number;
  source: 'DEX_AGGREGATOR' | 'RESERVE_BANK' | 'MARKET_MAKER';
  confidenceScore: number; // 0.0 - 1.0
  signature?: string; // Simulating cryptographic proof
}

// Legal Engine Types
export interface LegalAgreement {
  id: string;
  type: 'IP_TRANSFER' | 'SERVICE_AGREEMENT' | 'NDA';
  parties: {
    initiator: string;
    counterparty: string;
  };
  content: string; // The full text
  contentHash: string; // SHA-256 of content
  status: 'DRAFT' | 'SIGNED' | 'NOTARIZED';
  signature?: string;
  blockchainTxId?: string; // Proof of Existence
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

// Admin Bot Types
export interface BotLog {
  id: string;
  timestamp: number;
  action: string;
  details: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
}

export interface BotConfig {
  maintenanceIntervalMs: number;
  minTreasuryBalance: number;
  autoRebalance: boolean;
}

// Security & Fuzzing
export interface FuzzTestResult {
  id: string;
  timestamp: number;
  targetContract: 'STAKING' | 'BOUNTY' | 'NFT' | 'ORACLE';
  functionName: string;
  inputVector: string;
  status: 'PASS' | 'FAIL' | 'VULNERABILITY'; // PASS = handled correctly (even if error thrown), FAIL = crash/unexpected, VULN = exploit success
  details: string;
  latencyMs: number;
}

export interface SecurityAuditReport {
  campaignId: string;
  startTime: number;
  totalTests: number;
  vulnerabilitiesFound: number;
  coverage: number; // Percentage
  logs: FuzzTestResult[];
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