
// ... (Keep all existing imports)
import { TokenomicsConfig, UserSession, DesignAsset, ContextualMessage, Conversation, UserTier, VendorApplication, InventoryItem, LedgerEntry, ShippingZone, CartItem, SmartSuggestion, CheckoutResult, Order, OrderStatus, ServiceProviderProfile, ArbitratorProfile, Dispute, Bounty, BountyStatus, TrustProfile, DesignChallenge, EnterpriseProfile, EnterpriseMember, ServiceRequest, ServiceCategory, ServiceBid } from "../types";
import { TOKENOMICS, CONFIG } from "../constants";
import { visionAdapter } from "./vision/VisionAdapter";
import { trustScoreService } from "./trustScoreService";
import { stakingService } from "./stakingService";
import { systemConfigService } from "./adminService"; 
import { offlineService } from "./offlineService"; 
import { nftContractService } from "./nftContractService"; 

// ... (Keep constants PI_HEADERS, DEFAULT_AVATAR, CURRENT_USER_AVATAR)
const PI_HEADERS = {
  'X-Pi-App-ID': CONFIG.piNetwork.appId,
  'X-Chain-ID': CONFIG.network === 'MAINNET' ? 'Public Global Stellar Network ; September 2015' : 'Test SDF Network ; September 2015',
  'Content-Type': 'application/json',
  'Authorization': 'Bearer [PI_ACCESS_TOKEN_PLACEHOLDER]'
};

const DEFAULT_AVATAR = "https://ui-avatars.com/api/?name=Pi+User&background=7928ca&color=fff";
const CURRENT_USER_AVATAR = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150";

// ... (Keep Mock States: mockUserBalance, mockEnterprise, mockVendorProfile)
let mockUserBalance = 0;
let mockUserTier: UserTier = 'FREE';

let mockEnterprise: EnterpriseProfile = {
    id: 'ent_mega_corp',
    name: 'MegaCorp Structures',
    taxId: 'EIN-99-88221',
    mainWallet: 'G...MEGACORP_MAIN',
    creditLine: 50000,
    negotiatedCommission: 0.06, 
    tier: 'PLATINUM',
    members: [
        { id: 'user_1', username: 'PiUser_Alpha', role: 'MANAGER', spendingLimit: 10000, spentThisMonth: 1250 },
        { id: 'user_2', username: 'DesignLead_X', role: 'DESIGNER', spendingLimit: 2000, spentThisMonth: 1500 },
        { id: 'user_3', username: 'CFO_Bot', role: 'ACCOUNTANT', spendingLimit: 0, spentThisMonth: 0 },
    ]
};

let mockVendorProfile: VendorApplication = {
    companyName: '',
    taxId: '',
    contactEmail: '',
    status: 'NOT_APPLIED'
};

// ... (Keep mockInventory, mockCart, mockLedger, mockShippingZones, mockOrders, mockDesigns, mockGallery, mockChallenges, mockConversations, mockMessages, mockServiceProviders, mockArbitrators, mockDisputes)

let mockInventory: InventoryItem[] = [
    { id: 'inv_1', sku: 'MAT-PLA-001', name: 'PLA Filament (High Grade)', category: 'MATERIAL', quantity: 2, unitPrice: 2.50, location: 'Warehouse A', lowStockThreshold: 10, lastUpdated: Date.now(), sustainabilityTags: ['Standard'], co2PerUnit: 4.5, ecoRank: 3 },
    { id: 'inv_1_eco', sku: 'MAT-ECO-001', name: 'PLA Eco-Recycled', category: 'MATERIAL', quantity: 100, unitPrice: 1.50, location: 'Warehouse A', lowStockThreshold: 10, lastUpdated: Date.now(), sustainabilityTags: ['Recycled', 'Biodegradable'], co2PerUnit: 1.2, ecoRank: 10 },
    { id: 'inv_2', sku: 'KIT-HAB-SML', name: 'Micro-Habitat Kit', category: 'KIT', quantity: 8, unitPrice: 150.00, location: 'Warehouse B', lowStockThreshold: 15, lastUpdated: Date.now(), sustainabilityTags: ['Modular'], co2PerUnit: 150, ecoRank: 5 },
    { id: 'inv_2_b', sku: 'ACC-SOL-PNL', name: 'Solar Cell Add-on', category: 'MERCH', quantity: 50, unitPrice: 25.00, location: 'Warehouse B', lowStockThreshold: 5, lastUpdated: Date.now(), sustainabilityTags: ['Renewable Energy'], co2PerUnit: 0.0, ecoRank: 9 },
    { id: 'inv_3', sku: 'TOOL-SCN-HND', name: 'Handheld 3D Scanner', category: 'TOOL', quantity: 3, unitPrice: 450.00, location: 'Secure Vault', lowStockThreshold: 2, lastUpdated: Date.now(), sustainabilityTags: [], co2PerUnit: 12.0, ecoRank: 1 }
];

let mockCart: CartItem[] = [
    { ...mockInventory[0], cartQuantity: 5 }, 
    { ...mockInventory[2], cartQuantity: 1 }
];

let mockLedger: LedgerEntry[] = [
    { id: 'led_1', itemId: 'inv_1', itemName: 'PLA Filament (High Grade)', type: 'INBOUND', quantity: 50, timestamp: Date.now() - 10000000, reason: 'Initial Stock', performedBy: 'System' },
    { id: 'led_2', itemId: 'inv_2', itemName: 'Micro-Habitat Kit', type: 'OUTBOUND', quantity: 2, timestamp: Date.now() - 5000000, reason: 'Order #4421', performedBy: 'LogisticsBot' }
];

let mockShippingZones: ShippingZone[] = [
    { id: 'zone_1', name: 'North America', regions: ['USA', 'Canada', 'Mexico'], baseRate: 5.0, incrementalRate: 1.5, estimatedDeliveryDays: '3-5', isActive: true },
    { id: 'zone_2', name: 'European Union', regions: ['Germany', 'France', 'Spain', 'Italy'], baseRate: 8.0, incrementalRate: 2.0, estimatedDeliveryDays: '5-7', isActive: true },
    { id: 'zone_3', name: 'Asia Pacific', regions: ['Japan', 'South Korea', 'Singapore'], baseRate: 12.0, incrementalRate: 3.0, estimatedDeliveryDays: '7-14', isActive: true }
];

let mockOrders: Order[] = [
    {
        id: 'ORD-1001-ALPHA',
        customerId: 'PiUser_Alpha',
        customerName: 'Alice Construct',
        items: [ { ...mockInventory[2], cartQuantity: 1 } ],
        total: 150.00,
        status: 'SHIPPED',
        timestamp: Date.now() - 86400000,
        shippingAddress: '123 Block Chain Ave, Crypto City, CA 90210',
        trackingNumber: 'TRK-PI-8821X',
        payoutStatus: 'ESCROWED'
    },
    {
        id: 'ORD-1002-BETA',
        customerId: 'user_z44',
        customerName: 'Bob Builder',
        items: [ { ...mockInventory[1], cartQuantity: 5 }, { ...mockInventory[3], cartQuantity: 2 } ],
        total: 57.50,
        status: 'PENDING',
        timestamp: Date.now() - 3600000,
        shippingAddress: '404 Soroban Lane, Stellar Node 4, NY 10001',
        payoutStatus: 'ESCROWED'
    }
];

let mockDesigns: DesignAsset[] = [
  {
    id: 'design_alpha_01',
    title: 'Neo-Tokyo Residential Block',
    timestamp: Date.now() - 100000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&q=80&w=600&h=600',
    highResUrl: null,
    status: 'LOCKED',
    price: 0.50,
    format: 'OBJ',
    author: 'PiUser_Alpha',
    authorAvatar: CURRENT_USER_AVATAR,
    likes: 124,
    views: 450,
    installationProof: { status: 'NONE' },
    geolocation: { lat: 35.6762, lng: 139.6503, timezone: 'Asia/Tokyo' }
  }
];

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
    views: 2100,
    geolocation: { lat: 28.5383, lng: -81.3792, timezone: 'America/New_York' }
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
    views: 1200,
    geolocation: { lat: -8.4095, lng: 115.1889, timezone: 'Asia/Makassar' }
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
    views: 5600,
    geolocation: { lat: 22.3193, lng: 114.1694, timezone: 'Asia/Hong_Kong' }
  }
];

let mockChallenges: DesignChallenge[] = [
    {
        id: 'chal_001',
        title: 'Micro-Housing for Urban Density',
        description: 'Design a sub-20sqm living unit that maximizes utility in dense urban environments. Must include sustainable materials.',
        rewardARTX: 5000,
        sponsorDAO: 'Urban Future Guild',
        deadline: Date.now() + 1209600000, 
        participants: 42,
        status: 'ACTIVE',
        requirements: ['< 20sqm', 'Recycled Materials', 'OBJ Format'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=400&h=250'
    },
    {
        id: 'chal_002',
        title: 'Martian Greenhouse Concept',
        description: 'Create a pressurized greenhouse module suitable for Martian colonization. Focus on structural integrity and radiation shielding.',
        rewardARTX: 10000,
        sponsorDAO: 'Interplanetary Architex DAO',
        deadline: Date.now() + 604800000, 
        participants: 128,
        status: 'VOTING',
        requirements: ['Pressurized Seal', 'Radiation Shielding', 'Hydroponics Layout'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&h=250'
    }
];

let mockConversations: Conversation[] = [
    {
        contextId: 'support_general',
        contextType: 'SUPPORT',
        title: 'General Support',
        lastMessage: 'Welcome to Architex Support.',
        lastTimestamp: Date.now() - 1000000,
        unreadCount: 0,
        thumbnailUrl: DEFAULT_AVATAR
    }
];

let mockMessages: ContextualMessage[] = [
    {
        id: 'msg_0',
        contextId: 'support_general',
        sender: 'system',
        text: 'Welcome to Architex Support. How can we help you today?',
        timestamp: Date.now() - 1000000,
        isRead: true
    }
];

const mockServiceProviders: ServiceProviderProfile[] = [
    {
        id: 'prov_1',
        username: 'FixItFelix',
        displayName: 'Felix Construction',
        role: 'CONTRACTOR',
        avatarUrl: 'https://ui-avatars.com/api/?name=FC&background=22c55e&color=fff',
        reputationScore: 98,
        verifiedId: true,
        certifications: [
            { name: 'Licensed General Contractor', issuer: 'State Board', date: Date.now() - 31536000000, verified: true },
            { name: 'OSHA Safety Cert', issuer: 'OSHA', date: Date.now() - 15000000000, verified: true }
        ],
        jobsCompleted: 48, 
        hourlyRate: 85,
        location: 'California, USA',
        available: true,
        geoStatus: 'ONLINE',
        currentLocation: { lat: 0.01, lng: 0.01 } 
    },
    {
        id: 'prov_2',
        username: 'TechWiz_Pi',
        displayName: 'TechWiz Solar Install',
        role: 'TECHNICIAN',
        avatarUrl: 'https://ui-avatars.com/api/?name=TW&background=0ea5e9&color=fff',
        reputationScore: 92,
        verifiedId: true,
        certifications: [
            { name: 'PV Installation Pro', issuer: 'SolarEnergy Int.', date: Date.now() - 20000000000, verified: true }
        ],
        jobsCompleted: 12,
        hourlyRate: 60,
        location: 'Nevada, USA',
        available: true,
        geoStatus: 'BUSY',
        currentLocation: { lat: -0.02, lng: 0.03 }
    }
];

const mockArbitrators: ArbitratorProfile[] = [
    {
        id: 'arb_1',
        username: 'JusticeBot_V1',
        displayName: 'Hon. Justice Unit',
        specialty: 'CONSTRUCTION',
        casesSolved: 142,
        reputationScore: 99,
        feePerCase: 50
    },
    {
        id: 'arb_2',
        username: 'LegalEagle_Pi',
        displayName: 'Sarah Law',
        specialty: 'IP_RIGHTS',
        casesSolved: 89,
        reputationScore: 95,
        feePerCase: 75
    },
    {
        id: 'arb_3',
        username: 'CodeArbiter',
        displayName: 'Dev Dispute Solver',
        specialty: 'FINANCIAL',
        casesSolved: 210,
        reputationScore: 97,
        feePerCase: 40
    }
];

let mockDisputes: Dispute[] = [
    {
        id: 'disp_alpha_001',
        bountyId: 'bounty_mock_service_01',
        initiator: 'PiUser_Alpha',
        respondent: 'FixItFelix',
        reason: 'Work not completed according to blueprint specifications.',
        status: 'OPEN',
        arbitratorId: null,
        evidence: [
            { submittedBy: 'PiUser_Alpha', text: 'Uploaded photo showing incorrect wiring.', timestamp: Date.now() - 100000 }
        ],
        createdAt: Date.now() - 200000
    }
];

let activeServiceRequests: ServiceRequest[] = [];

export const dalGetAccountInfo = async (): Promise<UserSession> => {
  return offlineService.wrapFetch('account_info', async () => {
      await new Promise(resolve => setTimeout(resolve, 800));

      const username = 'PiUser_Alpha'; 
      const stats = {
          designsCreated: 12,
          likesReceived: 345,
          volumeTraded: 15.5
      };

      const stakes = await stakingService.getUserStakes('CURRENT_USER'); 
      const totalStaked = stakes.reduce((sum, s) => sum + s.amount, 0);

      const trustProfile = trustScoreService.calculateTrustScore(
          stats,
          245, 
          0, 
          totalStaked
      );

      const votingPower = trustScoreService.calculateVotingPower(totalStaked, trustProfile.score);
      const isWhitelisted = await systemConfigService.isUserWhitelisted(username);
      
      const hasSignedToS = offlineService.getFromCache<boolean>('user_tos_signed') || false;

      return {
        isAuthenticated: true,
        username,
        walletAddress: 'G...ARCHITEX_USER',
        hasTrustline: mockUserBalance > 0,
        balance: mockUserBalance,
        avatarUrl: CURRENT_USER_AVATAR,
        stats,
        tier: mockUserTier,
        role: 'USER',
        trustProfile,
        votingPower,
        enterpriseId: 'ent_mega_corp',
        isWhitelisted,
        hasSignedToS
      };
  });
};

export const dalSignTerms = async (walletAddress: string): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 1000));
    offlineService.saveToCache('user_tos_signed', true);
    return true;
};

export const dalUpgradeTier = async (newTier: UserTier): Promise<boolean> => {
    mockUserTier = newTier;
    return true;
};

export const dalCreateTrustline = async (tokenId: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  mockUserBalance = 100.00; 
  return true;
};

export const dalGetLiveTokenStats = async (): Promise<TokenomicsConfig> => {
  return TOKENOMICS;
};

export const dalGenerateBlueprint = async (scanData: any): Promise<DesignAsset> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // AI Building Code Compliance Check (Phase 6.3)
    const warnings: string[] = [];
    if (Math.random() > 0.7) {
        warnings.push("Zoning Alert: Height exceeds local residential limit (40m).");
        warnings.push("Setback Warning: Structure encroaches on side easement.");
    }

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
        views: 0,
        installationProof: { status: 'NONE' },
        geolocation: { lat: 40.7128, lng: -74.0060, timezone: 'America/New_York' },
        zoningWarnings: warnings // Compliance Flags
    };
    mockDesigns.unshift(newDesign);
    return newDesign;
};

export const dalGetUserDesigns = async (): Promise<DesignAsset[]> => { 
    return offlineService.wrapFetch('user_designs', async () => {
        return [...mockDesigns]; 
    });
};

export const dalGetPublicGallery = async (): Promise<DesignAsset[]> => { return [...mockGallery, ...mockDesigns]; };
export const dalUnlockDesign = async (paymentId: string, designId: string): Promise<DesignAsset | null> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const designIndex = mockDesigns.findIndex(d => d.id === designId);
    if (designIndex > -1) {
        mockDesigns[designIndex] = { ...mockDesigns[designIndex], status: 'UNLOCKED', highResUrl: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&q=80&w=1920&h=1080' };
        return mockDesigns[designIndex];
    }
    return null;
};
export const dalSubmitInstallationProof = async (designId: string, imageBase64: string): Promise<{ success: boolean; reward?: number; reason?: string }> => {
    const idx = mockDesigns.findIndex(d => d.id === designId);
    if (idx === -1) return { success: false, reason: "Design not found" };
    const verification = await visionAdapter.verifyRealization(imageBase64);
    if (verification.verified && verification.confidence > 0.7) {
        const reward = 25.0; 
        mockDesigns[idx].installationProof = { status: 'VERIFIED', imageUrl: `data:image/jpeg;base64,${imageBase64.substring(0, 100)}...`, timestamp: Date.now(), rewardAmount: reward };
        mockUserBalance += reward;
        return { success: true, reward };
    } else {
        mockDesigns[idx].installationProof = { status: 'REJECTED', timestamp: Date.now() };
        return { success: false, reason: verification.comment || "AI could not verify physical installation." };
    }
};

// ... (Keep Vendor, Inventory, Cart, Messaging methods as is)
export const dalGetVendorProfile = async (): Promise<VendorApplication> => { return { ...mockVendorProfile }; };
export const dalSubmitVendorApplication = async (data: Partial<VendorApplication>, file?: { name: string, data: string }): Promise<VendorApplication> => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    mockVendorProfile = { ...mockVendorProfile, ...data, status: 'PENDING', submittedAt: Date.now() };
    if (file) { mockVendorProfile.insuranceDoc = { fileName: file.name, uploadedAt: Date.now(), verified: false }; }
    return { ...mockVendorProfile };
};
export const dalGetVendorOrders = async (): Promise<Order[]> => { return [...mockOrders].sort((a, b) => b.timestamp - a.timestamp); };

// Phase 5.3: Check Auto-Release
export const dalCheckAutoRelease = async (): Promise<void> => {
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    let releasedCount = 0;

    mockOrders.forEach(order => {
        if (order.status === 'SHIPPED' && order.payoutStatus === 'ESCROWED') {
            if (now - order.timestamp > fourteenDaysMs) {
                // Auto-release logic
                order.payoutStatus = 'AUTO_RELEASED';
                const total = order.total;
                console.log(`[SmartContract] AUTO-RELEASE (Time-Lock Expired): ${order.id}`);
                console.log(`[SmartContract] VENDOR CREDIT: ${(total * 0.90).toFixed(2)} Pi`);
                releasedCount++;
            }
        }
    });
    if(releasedCount > 0) console.log(`[System] Auto-released ${releasedCount} orders.`);
};

export const dalGetClientOrders = async (): Promise<Order[]> => { 
    // Run the check before returning logic
    await dalCheckAutoRelease();
    return [...mockOrders].filter(o => o.customerId === 'PiUser_Alpha').sort((a, b) => b.timestamp - a.timestamp); 
};

export const dalUpdateOrderStatus = async (orderId: string, status: OrderStatus, trackingNumber?: string): Promise<Order | null> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const idx = mockOrders.findIndex(o => o.id === orderId);
    if (idx === -1) return null;
    mockOrders[idx] = { ...mockOrders[idx], status, trackingNumber: trackingNumber || mockOrders[idx].trackingNumber };
    return mockOrders[idx];
};

export const dalConfirmReceipt = async (orderId: string): Promise<Order | null> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const idx = mockOrders.findIndex(o => o.id === orderId);
    if (idx === -1) return null;
    
    const order = mockOrders[idx];
    
    // Phase 5.4: Automated Revenue Split
    const total = order.total;
    const platformFee = total * 0.10; // 10% Treasury
    const vendorPayout = total * 0.90; // 90% Vendor
    
    console.log(`[SmartContract] SPLIT EXECUTED for Order ${orderId}`);
    console.log(`[SmartContract] TREASURY CREDIT: ${platformFee.toFixed(2)} Pi`);
    console.log(`[SmartContract] VENDOR CREDIT: ${vendorPayout.toFixed(2)} Pi`);
    
    mockOrders[idx] = { 
        ...order, 
        status: 'DELIVERED', 
        payoutStatus: 'RELEASED' 
    };
    return mockOrders[idx];
};

export const dalGetInventory = async (): Promise<InventoryItem[]> => { return [...mockInventory]; };
export const dalGetLedger = async (): Promise<LedgerEntry[]> => { return [...mockLedger].sort((a, b) => b.timestamp - a.timestamp); };
export const dalAdjustStock = async (itemId: string, quantityDelta: number, reason: string): Promise<boolean> => {
    const idx = mockInventory.findIndex(i => i.id === itemId);
    if (idx === -1) return false;
    const item = mockInventory[idx];
    const newQuantity = item.quantity + quantityDelta;
    if (newQuantity < 0) return false; 
    mockInventory[idx] = { ...item, quantity: newQuantity, lastUpdated: Date.now() };
    const entry: LedgerEntry = { id: `led_${Date.now()}`, itemId, itemName: item.name, type: quantityDelta > 0 ? 'INBOUND' : 'OUTBOUND', quantity: Math.abs(quantityDelta), timestamp: Date.now(), reason, performedBy: 'PiUser_Alpha' };
    mockLedger.unshift(entry);
    return true;
};
export const dalGetShippingZones = async (): Promise<ShippingZone[]> => { return [...mockShippingZones]; };
export const dalUpdateShippingZone = async (zone: ShippingZone): Promise<boolean> => {
    const idx = mockShippingZones.findIndex(z => z.id === zone.id);
    if (idx > -1) { mockShippingZones[idx] = zone; } else { mockShippingZones.push(zone); }
    return true;
};
export const dalGetCart = async (): Promise<CartItem[]> => { 
    return offlineService.wrapFetch('cart_items', async () => [...mockCart]);
};
export const dalAddToCart = async (item: InventoryItem, qty: number = 1): Promise<void> => {
    const idx = mockCart.findIndex(i => i.id === item.id);
    if (idx > -1) { mockCart[idx].cartQuantity += qty; } else { mockCart.push({ ...item, cartQuantity: qty }); }
    offlineService.saveToCache('cart_items', mockCart); 
};
export const dalRemoveFromCart = async (itemId: string): Promise<void> => { 
    mockCart = mockCart.filter(i => i.id !== itemId); 
    offlineService.saveToCache('cart_items', mockCart);
};
export const dalGetSmartSuggestions = async (): Promise<SmartSuggestion[]> => {
    await new Promise(r => setTimeout(r, 600)); 
    const suggestions: SmartSuggestion[] = [];
    mockCart.forEach(cartItem => {
        if (cartItem.sku === 'MAT-PLA-001') {
            const ecoAlternative = mockInventory.find(i => i.sku === 'MAT-ECO-001');
            if (ecoAlternative) {
                const savingsPerUnit = cartItem.unitPrice - ecoAlternative.unitPrice;
                const totalSavings = savingsPerUnit * cartItem.cartQuantity;
                suggestions.push({ id: 'sugg_swap_pla', type: 'ALTERNATIVE', originalItemId: cartItem.id, suggestedItem: ecoAlternative, message: "Switching to Eco-Recycled PLA maintains structural integrity for standard prints while reducing cost.", savingsAmount: totalSavings, savingsPercent: Math.round((savingsPerUnit / cartItem.unitPrice) * 100) });
            }
        }
        if (cartItem.sku === 'KIT-HAB-SML') {
            const solarAddon = mockInventory.find(i => i.sku === 'ACC-SOL-PNL');
            const hasSolarInCart = mockCart.some(i => i.sku === 'ACC-SOL-PNL');
            if (solarAddon && !hasSolarInCart) {
                suggestions.push({ id: 'sugg_bundle_solar', type: 'BUNDLE', suggestedItem: solarAddon, message: "Optimization: Habitats require power. Bundle a Solar Cell now to save 5 Pi on shipping and assembly.", savingsAmount: 5.0, savingsPercent: 15 });
            }
        }
        if (cartItem.co2PerUnit && cartItem.co2PerUnit > 3.0) {
            const betterEco = mockInventory.find(i => i.category === cartItem.category && i.id !== cartItem.id && i.co2PerUnit !== undefined && i.co2PerUnit < cartItem.co2PerUnit);
            if (betterEco) {
                const co2Saved = (cartItem.co2PerUnit - betterEco.co2PerUnit!) * cartItem.cartQuantity;
                suggestions.push({ id: `eco_upg_${cartItem.id}`, type: 'ECO_UPGRADE', originalItemId: cartItem.id, suggestedItem: betterEco, message: `🌱 Sustainability Alert: Switching to ${betterEco.name} reduces carbon footprint by ${co2Saved.toFixed(1)}kg CO2.`, savingsAmount: 0, savingsPercent: 0, co2Reduction: co2Saved });
            }
        }
    });
    return suggestions;
};
export const dalApplySuggestion = async (suggestion: SmartSuggestion): Promise<void> => {
    if ((suggestion.type === 'ALTERNATIVE' || suggestion.type === 'ECO_UPGRADE') && suggestion.originalItemId) {
        const original = mockCart.find(i => i.id === suggestion.originalItemId);
        if (original) {
            mockCart = mockCart.filter(i => i.id !== suggestion.originalItemId);
            await dalAddToCart(suggestion.suggestedItem, original.cartQuantity);
        }
    } else if (suggestion.type === 'BUNDLE') { await dalAddToCart(suggestion.suggestedItem, 1); }
};
export const dalCheckout = async (liabilitySigned: boolean = true): Promise<CheckoutResult> => {
    await new Promise(r => setTimeout(r, 1500));
    for (const cartItem of mockCart) {
        const stockItem = mockInventory.find(i => i.id === cartItem.id);
        if (!stockItem || stockItem.quantity < cartItem.cartQuantity) {
            const alternative = mockInventory.find(i => i.category === stockItem?.category && i.id !== stockItem?.id && i.quantity >= cartItem.cartQuantity);
            let suggestion: SmartSuggestion | undefined;
            if (alternative) {
                const diff = (cartItem.unitPrice - alternative.unitPrice) * cartItem.cartQuantity;
                suggestion = { id: `conflict_sol_${Date.now()}`, type: 'ALTERNATIVE', originalItemId: cartItem.id, suggestedItem: alternative, message: `Critical Stock Alert: '${cartItem.name}' sold out. Instant swap to '${alternative.name}' available.`, savingsAmount: diff, savingsPercent: 0 };
            }
            return { success: false, conflict: { conflictingItemId: cartItem.id, itemName: cartItem.name, availableQuantity: stockItem ? stockItem.quantity : 0, requestedQuantity: cartItem.cartQuantity, resolutionSuggestion: suggestion } };
        }
    }
    mockInventory = mockInventory.map(inv => {
        const inCart = mockCart.find(c => c.id === inv.id);
        if (inCart) { return { ...inv, quantity: inv.quantity - inCart.cartQuantity }; }
        return inv;
    });
    const newOrder: Order = { 
        id: `ORD-${Date.now().toString().substr(-6).toUpperCase()}`, 
        customerId: 'PiUser_Alpha', 
        customerName: 'Current User', 
        items: [...mockCart], 
        total: mockCart.reduce((sum, item) => sum + (item.unitPrice * item.cartQuantity), 0), 
        status: 'PENDING', 
        timestamp: Date.now(), 
        shippingAddress: '123 Main St, Pi Network City, 00000', 
        payoutStatus: 'ESCROWED', 
        liabilityReleaseSigned: liabilitySigned 
    };
    mockOrders.unshift(newOrder);
    mockCart = [];
    return { success: true, orderId: newOrder.id };
};
export const dalGetConversations = async (): Promise<Conversation[]> => { return [...mockConversations].sort((a, b) => b.lastTimestamp - a.lastTimestamp); };
export const dalGetMessages = async (contextId: string): Promise<ContextualMessage[]> => { return mockMessages.filter(m => m.contextId === contextId).sort((a, b) => a.timestamp - b.timestamp); };
export const dalSendMessage = async (contextId: string, text: string): Promise<ContextualMessage> => {
    const newMessage: ContextualMessage = { id: `msg_${Date.now()}`, contextId, sender: 'user', text, timestamp: Date.now(), isRead: true };
    mockMessages.push(newMessage);
    return newMessage;
};
export const dalInitializeConversation = async (design: DesignAsset): Promise<string> => {
    const existing = mockConversations.find(c => c.contextId === design.id);
    if (existing) return existing.contextId;
    const newConv: Conversation = { contextId: design.id, contextType: 'DESIGN', title: `Inquiry: ${design.title}`, lastMessage: 'Conversation started.', lastTimestamp: Date.now(), unreadCount: 0, thumbnailUrl: design.thumbnailUrl };
    mockConversations.unshift(newConv);
    mockMessages.push({ id: `init_${design.id}`, contextId: design.id, sender: 'system', text: `Context Attached: ${design.title} (${design.format}). Reference ID: ${design.id}.`, timestamp: Date.now(), isRead: true });
    return design.id;
};
export const dalGetServiceProviders = async (): Promise<ServiceProviderProfile[]> => { return [...mockServiceProviders]; };
export const dalGetArbitrators = async (): Promise<ArbitratorProfile[]> => { return [...mockArbitrators]; };
export const dalGetDisputes = async (username: string): Promise<Dispute[]> => { return mockDisputes.filter(d => d.initiator === username || d.respondent === username); };
export const dalGetDisputeById = async (id: string): Promise<Dispute | null> => { return mockDisputes.find(d => d.id === id) || null; };
export const dalCreateDispute = async (bountyId: string, initiator: string, respondent: string, reason: string): Promise<Dispute> => {
    const dispute: Dispute = { id: `disp_${Date.now()}`, bountyId, initiator, respondent, reason, status: 'OPEN', arbitratorId: null, evidence: [], createdAt: Date.now() };
    mockDisputes.push(dispute);
    return dispute;
};
export const dalUpdateDispute = async (dispute: Dispute): Promise<void> => {
    const idx = mockDisputes.findIndex(d => d.id === dispute.id);
    if (idx > -1) { mockDisputes[idx] = dispute; }
};
export const dalGetActiveChallenges = async (): Promise<DesignChallenge[]> => { return [...mockChallenges]; };
export const dalSubmitToChallenge = async (challengeId: string, designId: string): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 1000));
    const idx = mockChallenges.findIndex(c => c.id === challengeId);
    if (idx > -1) { mockChallenges[idx].participants += 1; return true; }
    return false;
};
export const dalGetEnterpriseProfile = async (enterpriseId: string): Promise<EnterpriseProfile> => { return mockEnterprise; };
export const dalAddEnterpriseUser = async (username: string, role: EnterpriseMember['role'], limit: number): Promise<void> => {
    await new Promise(r => setTimeout(r, 800));
    const newUser: EnterpriseMember = { id: `user_${Date.now()}`, username, role, spendingLimit: limit, spentThisMonth: 0 };
    mockEnterprise.members.push(newUser);
};
export const dalSubmitBulkOrder = async (items: { sku: string, quantity: number }[]): Promise<Order> => {
    await new Promise(r => setTimeout(r, 1500));
    let total = 0;
    const cartItems: CartItem[] = [];
    items.forEach(req => {
        const invItem = mockInventory.find(i => i.sku === req.sku);
        if (invItem) {
            const discount = req.quantity > 50 ? 0.9 : 1.0;
            const itemTotal = (invItem.unitPrice * req.quantity) * discount;
            total += itemTotal;
            cartItems.push({ ...invItem, cartQuantity: req.quantity });
        }
    });
    const newOrder: Order = { id: `B2B-${Date.now()}`, customerId: 'ent_mega_corp', customerName: mockEnterprise.name, items: cartItems, total: total, status: 'PROCESSING', timestamp: Date.now(), shippingAddress: 'Enterprise HQ Dock 4', payoutStatus: 'ESCROWED', isBulkOrder: true };
    mockOrders.unshift(newOrder);
    return newOrder;
};

// ... (Architex Go)
export const dalCreateServiceRequest = async (category: ServiceCategory, desc: string, location: string): Promise<ServiceRequest> => {
    await new Promise(r => setTimeout(r, 800));
    const newReq: ServiceRequest = {
        id: `req_go_${Date.now()}`,
        clientId: 'PiUser_Alpha',
        category,
        description: desc,
        location,
        coordinates: { lat: 0, lng: 0 }, 
        status: 'BIDDING',
        suggestedPrice: { min: 20, max: 50 },
        bids: [],
        createdAt: Date.now()
    };
    activeServiceRequests.push(newReq);
    
    // Simulate Incoming Bid
    setTimeout(() => {
        const bid: ServiceBid = {
            id: `bid_${Date.now()}`,
            providerId: 'prov_1',
            providerName: 'Felix Construction',
            providerAvatar: 'https://ui-avatars.com/api/?name=FC&background=22c55e&color=fff',
            providerRating: 4.9,
            amount: 45,
            etaMinutes: 12,
            distanceKm: 3.2
        };
        const idx = activeServiceRequests.findIndex(r => r.id === newReq.id);
        if (idx > -1) {
            activeServiceRequests[idx].bids.push(bid);
        }
    }, 2000);

    return newReq;
};

export const dalGetActiveServiceRequest = async (): Promise<ServiceRequest | null> => {
    return offlineService.wrapFetch('active_service_request', async () => {
        return activeServiceRequests.find(r => r.status !== 'COMPLETED' && r.status !== 'CANCELLED') || null;
    });
};

export const dalGetNearbyProviders = async (category: ServiceCategory): Promise<ServiceProviderProfile[]> => {
    await new Promise(r => setTimeout(r, 600));
    return mockServiceProviders.filter(p => p.geoStatus === 'ONLINE');
};

export const dalAcceptBid = async (requestId: string, bidId: string): Promise<ServiceRequest | null> => {
    const idx = activeServiceRequests.findIndex(r => r.id === requestId);
    if (idx === -1) return null;
    
    const req = activeServiceRequests[idx];
    const bid = req.bids.find(b => b.id === bidId);
    if (!bid) return null;

    req.status = 'IN_PROGRESS';
    req.selectedProviderId = bid.providerId;
    req.finalPrice = bid.amount;
    
    return req;
};

// PHASE 6.4 + OFFLINE RESILIENCE
export const dalCompleteServiceRequest = async (requestId: string): Promise<boolean> => {
    
    // OFFLINE CHECK
    if (!offlineService.isOnline()) {
        offlineService.queueAction('COMPLETE_JOB', { requestId });
        return true; // Optimistic success
    }

    const idx = activeServiceRequests.findIndex(r => r.id === requestId);
    if (idx === -1) return false;
    
    const req = activeServiceRequests[idx];
    req.status = 'COMPLETED';

    // SOULBOUND TOKEN LOGIC (PHASE 6.4 D)
    // If provider has > 50 jobs, issue a badge
    if (req.selectedProviderId) {
        const provider = mockServiceProviders.find(p => p.id === req.selectedProviderId);
        if (provider) {
            provider.jobsCompleted = (provider.jobsCompleted || 0) + 1;
            
            if (provider.jobsCompleted >= 50) {
                const sbt = await nftContractService.issueSoulboundBadge(provider.id, 'MASTER_ARTISAN');
                if (!provider.soulboundTokens) provider.soulboundTokens = [];
                provider.soulboundTokens.push(sbt);
                console.log(`[Identity] Soulbound Token Minted for ${provider.username}`);
            }
        }
    }

    return true;
};
