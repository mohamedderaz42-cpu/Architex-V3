
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
  GOVERNANCE = 'GOVERNANCE',
  CHALLENGES = 'CHALLENGES',
  ENTERPRISE_PORTAL = 'ENTERPRISE_PORTAL',
  CALCULATOR = 'CALCULATOR',
  ARCHITEX_GO = 'ARCHITEX_GO'
}

export enum NetworkType {
  TESTNET = 'TESTNET',
  MAINNET = 'MAINNET'
}

export type SystemMode = 'DEV' | 'BETA' | 'LIVE' | 'MAINTENANCE';

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
  votingPower?: number;
  enterpriseId?: string;
  isWhitelisted?: boolean; // For Beta Access
  hasSignedToS: boolean; // Digital Immunity Protocol
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
  geolocation?: {
      lat: number;
      lng: number;
      timezone: string;
  };
  // AI Compliance
  zoningWarnings?: string[]; 
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
    // Phase 5: Immunity Protocol
    waiverSigned?: boolean;
    waiverSignature?: string;
    // Phase 5.3: ERP Integration
    erpApiKey?: string;
    webhookUrl?: string;
    inventorySyncEnabled?: boolean;
}

export interface ERPLog {
    id: string;
    timestamp: number;
    type: 'INBOUND_SYNC' | 'OUTBOUND_WEBHOOK' | 'ERROR';
    details: string;
    status: 'SUCCESS' | 'FAILED';
    latency: number;
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
    sustainabilityTags?: string[]; 
    co2PerUnit?: number;
    ecoRank?: number; // Calculated rank for display
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
export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'PENDING_VERIFICATION' | 'AWAITING_APPROVAL';

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
    payoutStatus?: 'ESCROWED' | 'RELEASED' | 'AUTO_RELEASED'; // Status of funds
    isBulkOrder?: boolean; // B2B flag
    liabilityReleaseSigned?: boolean; // Phase 5: Shipping shield
    requiresMultiSig?: boolean; // If true, needs Admin approval
}

// Smart Cart Types
export interface CartItem extends InventoryItem {
    cartQuantity: number;
}

export interface SmartSuggestion {
    id: string;
    type: 'ALTERNATIVE' | 'BUNDLE' | 'ECO_UPGRADE';
    originalItemId?: string; // If swapping
    suggestedItem: InventoryItem;
    message: string;
    savingsAmount: number; // In Pi
    savingsPercent: number;
    co2Reduction?: number;
}

export interface CheckoutResult {
    success: boolean;
    orderId?: string;
    status?: OrderStatus;
    conflict?: {
        conflictingItemId: string;
        itemName: string;
        availableQuantity: number;
        requestedQuantity: number;
        resolutionSuggestion?: SmartSuggestion; // The AI swap suggestion
    };
    reason?: string; // Failure reason
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
  type?: 'DESIGN' | 'SERVICE'; 
  disputeId?: string; 
}

export interface ContractPayout {
  total: number;
  platformFee: number;
  designerAmount: number;
  timestamp: number;
  discountApplied?: boolean;
}

// Service & Arbitration Types
export interface Certification {
    name: string;
    issuer: string;
    date: number;
    verified: boolean;
}

export interface SoulboundToken {
    id: string;
    name: string;
    icon: string; // Emoji or URL
    issuedAt: number;
    criteria: string; // e.g. "50 Jobs Completed"
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
    soulboundTokens?: SoulboundToken[]; // Identity Badges
    jobsCompleted?: number;
    hourlyRate: number;
    location: string;
    available: boolean;
    // Architex Go Fields
    geoStatus?: 'ONLINE' | 'OFFLINE' | 'BUSY';
    currentLocation?: { lat: number; lng: number };
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

// Architex Go Types
export type ServiceCategory = 'PLUMBING' | 'ELECTRICAL' | 'CARPENTRY' | 'PAINTING' | 'HVAC';

export interface ServiceBid {
    id: string;
    providerId: string;
    providerName: string;
    providerAvatar: string;
    providerRating: number;
    amount: number;
    etaMinutes: number;
    distanceKm: number;
}

export interface Milestone {
    id: string;
    name: string;
    amount: number;
    percentage: number;
    status: 'LOCKED' | 'RELEASED';
    requiresClientApproval: boolean;
}

export interface ServiceRequest {
    id: string;
    clientId: string;
    category: ServiceCategory;
    description: string;
    location: string; // Text address for now
    coordinates: { lat: number, lng: number };
    status: 'OPEN' | 'BIDDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED';
    suggestedPrice: { min: number, max: number };
    finalPrice?: number;
    selectedProviderId?: string;
    bids: ServiceBid[];
    createdAt: number;
    milestones?: Milestone[]; // For high value contracts
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

// Design Challenges
export interface DesignChallenge {
    id: string;
    title: string;
    description: string;
    rewardARTX: number; 
    sponsorDAO: string; 
    deadline: number;
    participants: number;
    status: 'ACTIVE' | 'VOTING' | 'CLOSED';
    requirements: string[];
    thumbnailUrl: string;
}

// Enterprise Types (Updated Phase 9)
export type EnterpriseRole = 'ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'DESIGNER' | 'PROCUREMENT' | 'TECHNICAL' | 'AUDITOR';

export interface EnterpriseMember {
    id: string;
    username: string;
    role: EnterpriseRole;
    spendingLimit: number; // Monthly limit
    spentThisMonth: number;
}

export interface EnterpriseProfile {
    id: string;
    name: string;
    taxId: string;
    mainWallet: string;
    members: EnterpriseMember[];
    creditLine: number;
    negotiatedCommission: number; // 0.05 to 0.08
    tier: 'GOLD' | 'PLATINUM';
    // Phase 9.1 KYB
    verificationStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED';
    kybDocs?: { type: string; url: string; verified: boolean }[];
    // Phase 9.1 Multi-Sig
    multiSigEnabled: boolean;
    requiredSignatures: number;
}

// RFQ Types (Phase 9.3)
export interface BlindBid {
    id: string;
    supplierName: string; // Hidden until award if needed, or visible
    amount: number;
    deliveryDate: number;
    isSealed: boolean; // True = amount hidden
}

export interface RFQ {
    id: string;
    title: string;
    items: { sku: string; quantity: number }[];
    status: 'OPEN' | 'CLOSED' | 'AWARDED';
    createdAt: number;
    deadline: number;
    bids: BlindBid[];
    awardedBidId?: string;
}

// B2B Contracts (Phase 9.4)
export interface B2BContract {
    id: string;
    rfqId: string;
    supplier: string;
    buyer: string;
    totalValue: number;
    terms: 'NET30' | 'NET60' | 'IMMEDIATE';
    dynamicFeeRate: number; // Tiered Commission
    status: 'ACTIVE' | 'COMPLETED';
}

// Oracle Types
export interface OracleQuote {
  pair: string; 
  rate: number;
  timestamp: number;
  source: 'DEX_AGGREGATOR' | 'RESERVE_BANK' | 'MARKET_MAKER';
  confidenceScore: number; // 0.0 - 1.0
  signature?: string; 
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
  b2bCommissionRate: number; 
}

// Security & Fuzzing
export interface FuzzTestResult {
  id: string;
  timestamp: number;
  targetContract: 'STAKING' | 'BOUNTY' | 'NFT' | 'ORACLE';
  functionName: string;
  inputVector: string;
  status: 'PASS' | 'FAIL' | 'VULNERABILITY'; 
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

// Stress Test Types (New)
export interface StressMetrics {
    activeUsers: number;
    transactionsPerSecond: number;
    avgLatencyMs: number;
    errorRate: number; // Percent
    cpuUsage: number; // Mock server CPU
    memoryUsage: number; // Mock server Memory
}

// External Audit Types (New)
export interface AuditReport {
    id: string;
    firmName: string;
    auditDate: number;
    scope: string;
    status: 'IN_PROGRESS' | 'PASSED' | 'PASSED_WITH_WARNINGS' | 'FAILED';
    reportHash: string; // IPFS Hash
    criticalIssuesFound: number;
    resolvedIssues: number;
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
