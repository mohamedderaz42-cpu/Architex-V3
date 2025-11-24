
import { TokenomicsConfig, UserSession, DesignAsset, ContextualMessage, Conversation, UserTier, VendorApplication, InventoryItem, LedgerEntry, ShippingZone, CartItem, SmartSuggestion, CheckoutResult, Order, OrderStatus, ServiceProviderProfile, ArbitratorProfile, Dispute, Bounty, BountyStatus, TrustProfile, DesignChallenge, EnterpriseProfile, EnterpriseMember, ServiceRequest, ServiceCategory, ServiceBid, RFQ, Plugin } from "../types";
import { TOKENOMICS, CONFIG } from "../constants";
import { visionAdapter } from "./vision/VisionAdapter";
import { trustScoreService } from "./trustScoreService";
import { stakingService } from "./stakingService";
import { systemConfigService } from "./adminService"; 
import { offlineService } from "./offlineService"; 
import { nftContractService } from "./nftContractService";
import { erpSyncService } from "./erpSyncService";
import { kybService } from "./kybService";
import { rfqService } from "./rfqService";
import { pluginSdk } from "./pluginSdk";

// ... (Previous Imports and Constants remain same) ...
const CURRENT_USER_AVATAR = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150";

let mockUserBalance = 0;
let mockUserTier: UserTier = 'FREE';

// Updated Mock Enterprise with RBAC and KYB fields
let mockEnterprise: EnterpriseProfile = {
    id: 'ent_mega_corp',
    name: 'MegaCorp Structures',
    taxId: 'EIN-99-88221',
    mainWallet: 'G...MEGACORP_MAIN',
    creditLine: 50000,
    negotiatedCommission: 0.06, 
    tier: 'PLATINUM',
    verificationStatus: 'UNVERIFIED',
    multiSigEnabled: true,
    requiredSignatures: 2,
    members: [
        { id: 'user_1', username: 'PiUser_Alpha', role: 'MANAGER', spendingLimit: 10000, spentThisMonth: 1250 },
        { id: 'user_2', username: 'DesignLead_X', role: 'DESIGNER', spendingLimit: 2000, spentThisMonth: 1500 },
        { id: 'user_3', username: 'CFO_Bot', role: 'AUDITOR', spendingLimit: 0, spentThisMonth: 0 },
        { id: 'user_4', username: 'Buyer_One', role: 'PROCUREMENT', spendingLimit: 5000, spentThisMonth: 200 },
        { id: 'user_5', username: 'Tech_Spec', role: 'TECHNICAL', spendingLimit: 0, spentThisMonth: 0 },
    ]
};

// ... (Keep mockVendorProfile, mockInventory, mockCart, mockLedger, mockShippingZones, mockOrders, mockDesigns, mockGallery) ...
let mockVendorProfile: VendorApplication = {
    companyName: 'EcoBuild Supply Co.',
    taxId: 'US-99-1020',
    contactEmail: 'supply@ecobuild.com',
    status: 'APPROVED',
    waiverSigned: true,
    waiverSignature: 'John Doe',
    inventorySyncEnabled: false,
    erpApiKey: '',
    webhookUrl: ''
};

let mockInventory: InventoryItem[] = [
    { id: 'inv_1', sku: 'MAT-PLA-001', name: 'PLA Filament (High Grade)', category: 'MATERIAL', quantity: 2, unitPrice: 2.50, location: 'Warehouse A', lowStockThreshold: 10, lastUpdated: Date.now(), sustainabilityTags: ['Standard'], co2PerUnit: 4.5, ecoRank: 3 },
    { id: 'inv_1_eco', sku: 'MAT-ECO-001', name: 'PLA Eco-Recycled', category: 'MATERIAL', quantity: 100, unitPrice: 1.50, location: 'Warehouse A', lowStockThreshold: 10, lastUpdated: Date.now(), sustainabilityTags: ['Recycled', 'Biodegradable'], co2PerUnit: 1.2, ecoRank: 10 },
    { id: 'inv_2', sku: 'KIT-HAB-SML', name: 'Micro-Habitat Kit', category: 'KIT', quantity: 8, unitPrice: 150.00, location: 'Warehouse B', lowStockThreshold: 15, lastUpdated: Date.now(), sustainabilityTags: ['Modular'], co2PerUnit: 150, ecoRank: 5 },
    { id: 'inv_2_b', sku: 'ACC-SOL-PNL', name: 'Solar Cell Add-on', category: 'MERCH', quantity: 50, unitPrice: 25.00, location: 'Warehouse B', lowStockThreshold: 5, lastUpdated: Date.now(), sustainabilityTags: ['Renewable Energy'], co2PerUnit: 0.0, ecoRank: 9 },
    { id: 'inv_3', sku: 'TOOL-SCN-HND', name: 'Handheld 3D Scanner', category: 'TOOL', quantity: 3, unitPrice: 450.00, location: 'Secure Vault', lowStockThreshold: 2, lastUpdated: Date.now(), sustainabilityTags: [], co2PerUnit: 12.0, ecoRank: 1 }
];

let mockCart: CartItem[] = [];
let mockOrders: Order[] = [];
let mockDesigns: DesignAsset[] = [];
let mockGallery: DesignAsset[] = [];
let mockMessages: ContextualMessage[] = [];
let mockConversations: Conversation[] = [];
let mockServiceProviders: ServiceProviderProfile[] = [];
let mockArbitrators: ArbitratorProfile[] = [];
let mockDisputes: Dispute[] = [];
let mockChallenges: DesignChallenge[] = [];
let activeServiceRequests: ServiceRequest[] = [];

// PLUGIN STORE MOCK DATA
let mockPlugins: Plugin[] = [
    { 
        id: 'plg_light_01', 
        name: 'Lumina: Adv. Lighting', 
        description: 'Real-time raytracing preview and IES profile support for blueprints.',
        version: '1.2.0',
        developer: 'PhotonLabs',
        price: 15,
        status: 'AVAILABLE',
        iconUrl: '💡',
        scriptUrl: 'https://cdn.architex.net/plugins/lumina.js',
        permissions: ['READ_DATA'],
        rating: 4.8,
        downloads: 1250
    },
    { 
        id: 'plg_cost_02', 
        name: 'Cost Estimator Pro', 
        description: 'Automatically calculate material BOM costs based on local suppliers.',
        version: '2.0.1',
        developer: 'BuildMetrics',
        price: 0, // Free
        status: 'AVAILABLE',
        iconUrl: '💰',
        scriptUrl: 'https://cdn.architex.net/plugins/cost.js',
        permissions: ['READ_STOCK', 'READ_PROFILE'],
        rating: 4.5,
        downloads: 5000
    },
    { 
        id: 'plg_vr_03', 
        name: 'VR Exporter', 
        description: 'One-click export to Unity/Unreal compatible formats.',
        version: '0.9.5',
        developer: 'MetaArch',
        price: 25,
        status: 'AVAILABLE',
        iconUrl: '🥽',
        scriptUrl: 'https://cdn.architex.net/plugins/vr.js',
        permissions: ['READ_DATA'],
        rating: 4.2,
        downloads: 800
    }
];

// ... (Keep basic DAL Getters/Setters: Account, Terms, Tier, Trustline) ...

export const dalGetAccountInfo = async (): Promise<UserSession> => {
  return offlineService.wrapFetch('account_info', async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        isAuthenticated: true,
        username: 'PiUser_Alpha',
        walletAddress: 'G...ARCHITEX_USER',
        hasTrustline: true,
        balance: mockUserBalance,
        avatarUrl: CURRENT_USER_AVATAR,
        stats: { designsCreated: 12, likesReceived: 345, volumeTraded: 15.5 },
        tier: mockUserTier,
        role: 'USER',
        enterpriseId: 'ent_mega_corp', // Linked to Enterprise
        hasSignedToS: true,
        isWhitelisted: true
      };
  });
};

export const dalSignTerms = async (walletAddress: string): Promise<boolean> => { return true; };
export const dalUpgradeTier = async (newTier: UserTier): Promise<boolean> => { mockUserTier = newTier; return true; };
export const dalCreateTrustline = async (tokenId: string): Promise<boolean> => { mockUserBalance = 100; return true; };
export const dalGetLiveTokenStats = async (): Promise<TokenomicsConfig> => { return TOKENOMICS; };

// ... (Keep Blueprint, Gallery, and Installation Logic) ...
export const dalGenerateBlueprint = async (scanData: any): Promise<DesignAsset> => {
    return { id: `design_${Date.now()}`, title: 'Gen Design', timestamp: Date.now(), thumbnailUrl: '', highResUrl: null, status: 'LOCKED', price: 0.5, format: 'CAD', author: 'Me', authorAvatar: '', likes: 0, views: 0 };
};
export const dalGetUserDesigns = async (): Promise<DesignAsset[]> => { return mockDesigns; };
export const dalGetPublicGallery = async (): Promise<DesignAsset[]> => { return mockGallery; };
export const dalUnlockDesign = async (pid: string, did: string): Promise<DesignAsset | null> => { return null; };
export const dalSubmitInstallationProof = async (did: string, img: string): Promise<any> => { return { success: true, reward: 25 }; };

// --- PLUGIN STORE LOGIC ---

export const dalGetPluginStore = async (): Promise<Plugin[]> => {
    await new Promise(r => setTimeout(r, 500));
    return [...mockPlugins];
};

export const dalGetInstalledPlugins = async (): Promise<Plugin[]> => {
    // Return plugins marked as INSTALLED
    return mockPlugins.filter(p => p.status === 'INSTALLED');
};

export const dalInstallPlugin = async (pluginId: string): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 1000)); // Simulate download
    const idx = mockPlugins.findIndex(p => p.id === pluginId);
    if (idx === -1) return false;
    
    // Update status
    mockPlugins[idx].status = 'INSTALLED';
    mockPlugins[idx].installDate = Date.now();
    
    // Initialize via SDK
    await pluginSdk.loadPlugin(mockPlugins[idx]);
    
    return true;
};

export const dalUninstallPlugin = async (pluginId: string): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 500));
    const idx = mockPlugins.findIndex(p => p.id === pluginId);
    if (idx === -1) return false;
    
    mockPlugins[idx].status = 'AVAILABLE';
    await pluginSdk.unloadPlugin(pluginId);
    return true;
};

export const dalPublishPlugin = async (manifest: any): Promise<void> => {
    await new Promise(r => setTimeout(r, 1500)); // Simulate review queue
    const newPlugin: Plugin = {
        ...manifest,
        status: 'AVAILABLE',
        downloads: 0,
        rating: 0
    };
    mockPlugins.push(newPlugin);
};

// ... (Rest of DAL) ...
export const dalGetEnterpriseProfile = async (enterpriseId: string): Promise<EnterpriseProfile> => {
    return mockEnterprise;
};

// Enhanced to support granular roles
export const dalAddEnterpriseUser = async (username: string, role: EnterpriseMember['role'], limit: number): Promise<void> => {
    await new Promise(r => setTimeout(r, 800));
    mockEnterprise.members.push({ 
        id: `user_${Date.now()}`, 
        username, 
        role, 
        spendingLimit: limit, 
        spentThisMonth: 0 
    });
};

export const dalSubmitKYBDocs = async (file: any, type: string): Promise<void> => {
    const res = await kybService.uploadDocument(file, type);
    if (!mockEnterprise.kybDocs) mockEnterprise.kybDocs = [];
    mockEnterprise.kybDocs.push({ type, url: res.url, verified: res.verified });
    mockEnterprise.verificationStatus = 'PENDING';
    
    // Trigger simulated admin verification
    setTimeout(async () => {
        mockEnterprise.verificationStatus = await kybService.verifyEnterprise(mockEnterprise.id);
        console.log("[KYB] Verification Complete: VERIFIED");
    }, 5000);
};

// Enhanced Bulk Order with RBAC & RFQ Logic
export const dalSubmitBulkOrder = async (items: { sku: string, quantity: number }[], asRFQ: boolean = false, userRole: EnterpriseMember['role'] = 'MANAGER'): Promise<{ order?: Order, rfq?: RFQ, status: string }> => {
    await new Promise(r => setTimeout(r, 1000));

    // 1. RBAC Check
    if (userRole === 'TECHNICAL' || userRole === 'AUDITOR') {
        throw new Error(`Role '${userRole}' is not authorized to place orders.`);
    }

    // 2. RFQ Route
    if (asRFQ) {
        const rfq = await rfqService.createRFQ(`RFQ for ${items.length} items`, items, Date.now() + 604800000);
        return { rfq, status: 'RFQ_OPENED' };
    }

    // 3. Direct Order Route
    let total = 0;
    const cartItems: CartItem[] = [];
    items.forEach(req => {
        const invItem = mockInventory.find(i => i.sku === req.sku);
        if (invItem) {
            total += invItem.unitPrice * req.quantity;
            cartItems.push({ ...invItem, cartQuantity: req.quantity });
        }
    });

    // 4. Spending Limit / Multi-Sig Check
    let orderStatus: OrderStatus = 'PROCESSING';
    if (userRole === 'PROCUREMENT' && total > 5000) {
        orderStatus = 'AWAITING_APPROVAL'; // Requires Manager/Admin approval
    }

    const newOrder: Order = { 
        id: `B2B-${Date.now()}`, 
        customerId: 'ent_mega_corp', 
        customerName: mockEnterprise.name, 
        items: cartItems, 
        total: total, 
        status: orderStatus, 
        timestamp: Date.now(), 
        shippingAddress: 'Enterprise HQ', 
        payoutStatus: 'ESCROWED', 
        isBulkOrder: true,
        requiresMultiSig: orderStatus === 'AWAITING_APPROVAL'
    };
    
    mockOrders.unshift(newOrder);
    return { order: newOrder, status: orderStatus };
};

export const dalGetRFQs = async (): Promise<RFQ[]> => {
    return rfqService.getRFQs();
};

// ... (Existing DAL functions for Orders, Inventory, etc.) ...
export const dalGetClientOrders = async (): Promise<Order[]> => { return mockOrders; };
export const dalGetVendorProfile = async (): Promise<VendorApplication> => { return mockVendorProfile; };
export const dalSubmitVendorApplication = async (data: any, fileData?: any): Promise<VendorApplication> => { return mockVendorProfile; };
export const dalUpdateVendorSettings = async (data: any): Promise<VendorApplication> => { return mockVendorProfile; };
export const dalGetVendorOrders = async (): Promise<Order[]> => { return mockOrders; };
export const dalUpdateOrderStatus = async (oid: string, status: OrderStatus, track?: string): Promise<Order | null> => { return null; };
export const dalConfirmReceipt = async (oid: string): Promise<Order | null> => { return null; };
export const dalGetInventory = async (): Promise<InventoryItem[]> => { return mockInventory; };
export const dalGetLedger = async (): Promise<LedgerEntry[]> => { return []; };
export const dalAdjustStock = async (sku: string, qty: number, reason: string): Promise<boolean> => { return true; };
export const dalGetShippingZones = async (): Promise<ShippingZone[]> => { return []; };
export const dalUpdateShippingZone = async (z: ShippingZone): Promise<boolean> => { return true; };
export const dalGetCart = async (): Promise<CartItem[]> => { return mockCart; };
export const dalAddToCart = async (item: InventoryItem, qty: number): Promise<void> => { };
export const dalRemoveFromCart = async (id: string): Promise<void> => { };
export const dalGetSmartSuggestions = async (): Promise<SmartSuggestion[]> => { return []; };
export const dalApplySuggestion = async (s: SmartSuggestion): Promise<void> => { };
export const dalCheckout = async (liability: boolean): Promise<CheckoutResult> => { return { success: true }; };
export const dalGetConversations = async (): Promise<Conversation[]> => { return []; };
export const dalGetMessages = async (cid: string): Promise<ContextualMessage[]> => { return []; };
export const dalSendMessage = async (cid: string, txt: string): Promise<ContextualMessage> => { return {} as any; };
export const dalInitializeConversation = async (d: DesignAsset): Promise<string> => { return ""; };
export const dalGetServiceProviders = async (): Promise<ServiceProviderProfile[]> => { return []; };
export const dalGetArbitrators = async (): Promise<ArbitratorProfile[]> => { return []; };
export const dalGetDisputes = async (u: string): Promise<Dispute[]> => { return []; };
export const dalGetDisputeById = async (id: string): Promise<Dispute | null> => { return null; };
export const dalCreateDispute = async (bid: string, init: string, resp: string, reas: string): Promise<Dispute> => { return {} as any; };
export const dalUpdateDispute = async (d: Dispute): Promise<void> => { };
export const dalGetActiveChallenges = async (): Promise<DesignChallenge[]> => { return []; };
export const dalSubmitToChallenge = async (cid: string, did: string): Promise<boolean> => { return true; };
export const dalCreateServiceRequest = async (c: ServiceCategory, d: string, l: string): Promise<ServiceRequest> => { return {} as any; };
export const dalGetActiveServiceRequest = async (): Promise<ServiceRequest | null> => { return null; };
export const dalGetNearbyProviders = async (c: ServiceCategory): Promise<ServiceProviderProfile[]> => { return []; };
export const dalAcceptBid = async (rid: string, bid: string): Promise<ServiceRequest | null> => { return null; };
export const dalCompleteServiceRequest = async (rid: string): Promise<boolean> => { return true; };
