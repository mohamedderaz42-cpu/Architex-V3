


import { TokenomicsConfig, UserSession, DesignAsset, ContextualMessage, Conversation, UserTier, VendorApplication, InventoryItem, LedgerEntry, ShippingZone, CartItem, SmartSuggestion, CheckoutResult, Order, OrderStatus } from "../types";
import { TOKENOMICS, CONFIG } from "../constants";
import { visionAdapter } from "./vision/VisionAdapter";

// Represents the compliant headers required by Pi Network distributed backend
const PI_HEADERS = {
  'X-Pi-App-ID': CONFIG.piNetwork.appId,
  'X-Chain-ID': CONFIG.network === 'MAINNET' ? 'Public Global Stellar Network ; September 2015' : 'Test SDF Network ; September 2015',
  'Content-Type': 'application/json',
  'Authorization': 'Bearer [PI_ACCESS_TOKEN_PLACEHOLDER]' // In prod, this is dynamically injected via Pi SDK
};

const DEFAULT_AVATAR = "https://ui-avatars.com/api/?name=Pi+User&background=7928ca&color=fff";
const CURRENT_USER_AVATAR = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150";

// Mock User State (Mutable for Demo)
let mockUserBalance = 0;
let mockUserTier: UserTier = 'FREE';

// Mock Vendor State
let mockVendorProfile: VendorApplication = {
    companyName: '',
    taxId: '',
    contactEmail: '',
    status: 'NOT_APPLIED'
};

// Mock Inventory Data
// NOTE: inv_1 quantity set to 2 to trigger conflict with default cart (which requests 5)
let mockInventory: InventoryItem[] = [
    { id: 'inv_1', sku: 'MAT-PLA-001', name: 'PLA Filament (High Grade)', category: 'MATERIAL', quantity: 2, unitPrice: 2.50, location: 'Warehouse A', lowStockThreshold: 10, lastUpdated: Date.now() },
    { id: 'inv_1_eco', sku: 'MAT-ECO-001', name: 'PLA Eco-Recycled', category: 'MATERIAL', quantity: 100, unitPrice: 1.50, location: 'Warehouse A', lowStockThreshold: 10, lastUpdated: Date.now() },
    { id: 'inv_2', sku: 'KIT-HAB-SML', name: 'Micro-Habitat Kit', category: 'KIT', quantity: 8, unitPrice: 150.00, location: 'Warehouse B', lowStockThreshold: 15, lastUpdated: Date.now() },
    { id: 'inv_2_b', sku: 'ACC-SOL-PNL', name: 'Solar Cell Add-on', category: 'MERCH', quantity: 50, unitPrice: 25.00, location: 'Warehouse B', lowStockThreshold: 5, lastUpdated: Date.now() },
    { id: 'inv_3', sku: 'TOOL-SCN-HND', name: 'Handheld 3D Scanner', category: 'TOOL', quantity: 3, unitPrice: 450.00, location: 'Secure Vault', lowStockThreshold: 2, lastUpdated: Date.now() }
];

// Mock Cart State
let mockCart: CartItem[] = [
    { ...mockInventory[0], cartQuantity: 5 }, // 5 Spools of Expensive PLA (Triggers conflict since qty is 2)
    { ...mockInventory[2], cartQuantity: 1 }  // 1 Habitat Kit
];

let mockLedger: LedgerEntry[] = [
    { id: 'led_1', itemId: 'inv_1', itemName: 'PLA Filament (High Grade)', type: 'INBOUND', quantity: 50, timestamp: Date.now() - 10000000, reason: 'Initial Stock', performedBy: 'System' },
    { id: 'led_2', itemId: 'inv_2', itemName: 'Micro-Habitat Kit', type: 'OUTBOUND', quantity: 2, timestamp: Date.now() - 5000000, reason: 'Order #4421', performedBy: 'LogisticsBot' }
];

// Mock Shipping Zones
let mockShippingZones: ShippingZone[] = [
    { id: 'zone_1', name: 'North America', regions: ['USA', 'Canada', 'Mexico'], baseRate: 5.0, incrementalRate: 1.5, estimatedDeliveryDays: '3-5', isActive: true },
    { id: 'zone_2', name: 'European Union', regions: ['Germany', 'France', 'Spain', 'Italy'], baseRate: 8.0, incrementalRate: 2.0, estimatedDeliveryDays: '5-7', isActive: true },
    { id: 'zone_3', name: 'Asia Pacific', regions: ['Japan', 'South Korea', 'Singapore'], baseRate: 12.0, incrementalRate: 3.0, estimatedDeliveryDays: '7-14', isActive: true }
];

// Mock Orders
let mockOrders: Order[] = [
    {
        id: 'ORD-1001-ALPHA',
        customerId: 'PiUser_Alpha',
        customerName: 'Alice Construct',
        items: [
             { ...mockInventory[2], cartQuantity: 1 }
        ],
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
        items: [
             { ...mockInventory[1], cartQuantity: 5 },
             { ...mockInventory[3], cartQuantity: 2 }
        ],
        total: 57.50,
        status: 'PENDING',
        timestamp: Date.now() - 3600000,
        shippingAddress: '404 Soroban Lane, Stellar Node 4, NY 10001',
        payoutStatus: 'ESCROWED'
    }
];


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
    views: 450,
    installationProof: { status: 'NONE' }
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

// --- Contextual Messaging Store ---
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

export const dalGetAccountInfo = async (): Promise<UserSession> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  return {
    isAuthenticated: true,
    username: 'PiUser_Alpha',
    walletAddress: 'G...ARCHITEX_USER',
    hasTrustline: mockUserBalance > 0, // Assume trustline if balance exists
    balance: mockUserBalance,
    avatarUrl: CURRENT_USER_AVATAR,
    stats: {
        designsCreated: 12,
        likesReceived: 345,
        volumeTraded: 15.5
    },
    tier: mockUserTier
  };
};

export const dalUpgradeTier = async (newTier: UserTier): Promise<boolean> => {
    mockUserTier = newTier;
    return true;
};

export const dalCreateTrustline = async (tokenId: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  mockUserBalance = 100.00; // Simulate Airdrop
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
        views: 0,
        installationProof: { status: 'NONE' }
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

export const dalSubmitInstallationProof = async (designId: string, imageBase64: string): Promise<{ success: boolean; reward?: number; reason?: string }> => {
    // 1. Find Design
    const idx = mockDesigns.findIndex(d => d.id === designId);
    if (idx === -1) return { success: false, reason: "Design not found" };

    // 2. Call AI Verification
    const verification = await visionAdapter.verifyRealization(imageBase64);

    if (verification.verified && verification.confidence > 0.7) {
        const reward = 25.0; // Fixed Cashback for now

        // 3. Update Status
        mockDesigns[idx].installationProof = {
            status: 'VERIFIED',
            imageUrl: `data:image/jpeg;base64,${imageBase64.substring(0, 100)}...`, // Truncated for mock
            timestamp: Date.now(),
            rewardAmount: reward
        };

        // 4. Update User Balance (Grant Cashback)
        mockUserBalance += reward;

        return { success: true, reward };
    } else {
        mockDesigns[idx].installationProof = {
            status: 'REJECTED',
            timestamp: Date.now()
        };
        return { success: false, reason: verification.comment || "AI could not verify physical installation." };
    }
};

// --- Vendor Portal Methods ---

export const dalGetVendorProfile = async (): Promise<VendorApplication> => {
    // Return a clone to prevent reference issues in mock
    return { ...mockVendorProfile };
};

export const dalSubmitVendorApplication = async (data: Partial<VendorApplication>, file?: { name: string, data: string }): Promise<VendorApplication> => {
    await new Promise(resolve => setTimeout(resolve, 1200));

    mockVendorProfile = {
        ...mockVendorProfile,
        ...data,
        status: 'PENDING',
        submittedAt: Date.now()
    };

    if (file) {
        mockVendorProfile.insuranceDoc = {
            fileName: file.name,
            uploadedAt: Date.now(),
            verified: false // Requires admin review
        };
    }

    return { ...mockVendorProfile };
};

export const dalGetVendorOrders = async (): Promise<Order[]> => {
    // In a real app, this would filter orders by the logged-in vendor ID
    return [...mockOrders].sort((a, b) => b.timestamp - a.timestamp);
};

export const dalGetClientOrders = async (): Promise<Order[]> => {
    // In a real app, this would query orders where customerId matches the logged-in user
    // For demo, filtering by 'PiUser_Alpha'
    return [...mockOrders].filter(o => o.customerId === 'PiUser_Alpha').sort((a, b) => b.timestamp - a.timestamp);
};

export const dalUpdateOrderStatus = async (orderId: string, status: OrderStatus, trackingNumber?: string): Promise<Order | null> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const idx = mockOrders.findIndex(o => o.id === orderId);
    if (idx === -1) return null;

    mockOrders[idx] = {
        ...mockOrders[idx],
        status,
        trackingNumber: trackingNumber || mockOrders[idx].trackingNumber
    };

    return mockOrders[idx];
};

export const dalConfirmReceipt = async (orderId: string): Promise<Order | null> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const idx = mockOrders.findIndex(o => o.id === orderId);
    if (idx === -1) return null;

    // Automate Payout Logic
    // 1. Update Status to Delivered
    // 2. Release Funds from Escrow
    
    mockOrders[idx] = {
        ...mockOrders[idx],
        status: 'DELIVERED',
        payoutStatus: 'RELEASED'
    };

    console.log(`[Smart Contract] Payout Released for Order ${orderId}: ${mockOrders[idx].total} Pi to Vendor.`);
    
    return mockOrders[idx];
};

// --- Inventory & Logistics Methods ---

export const dalGetInventory = async (): Promise<InventoryItem[]> => {
    return [...mockInventory];
};

export const dalGetLedger = async (): Promise<LedgerEntry[]> => {
    // Sort by newest first
    return [...mockLedger].sort((a, b) => b.timestamp - a.timestamp);
};

export const dalAdjustStock = async (itemId: string, quantityDelta: number, reason: string): Promise<boolean> => {
    const idx = mockInventory.findIndex(i => i.id === itemId);
    if (idx === -1) return false;

    const item = mockInventory[idx];
    const newQuantity = item.quantity + quantityDelta;

    if (newQuantity < 0) return false; // Prevent negative stock for this demo

    // Update Item
    mockInventory[idx] = {
        ...item,
        quantity: newQuantity,
        lastUpdated: Date.now()
    };

    // Add Ledger Entry
    const entry: LedgerEntry = {
        id: `led_${Date.now()}`,
        itemId,
        itemName: item.name,
        type: quantityDelta > 0 ? 'INBOUND' : 'OUTBOUND',
        quantity: Math.abs(quantityDelta),
        timestamp: Date.now(),
        reason,
        performedBy: 'PiUser_Alpha' // Mock user
    };
    mockLedger.unshift(entry);

    return true;
};

export const dalGetShippingZones = async (): Promise<ShippingZone[]> => {
    return [...mockShippingZones];
};

export const dalUpdateShippingZone = async (zone: ShippingZone): Promise<boolean> => {
    const idx = mockShippingZones.findIndex(z => z.id === zone.id);
    if (idx > -1) {
        mockShippingZones[idx] = zone;
    } else {
        mockShippingZones.push(zone);
    }
    return true;
};

// --- Smart Cart & AI Suggestion Methods ---

export const dalGetCart = async (): Promise<CartItem[]> => {
    return [...mockCart];
};

export const dalAddToCart = async (item: InventoryItem, qty: number = 1): Promise<void> => {
    const idx = mockCart.findIndex(i => i.id === item.id);
    if (idx > -1) {
        mockCart[idx].cartQuantity += qty;
    } else {
        mockCart.push({ ...item, cartQuantity: qty });
    }
};

export const dalRemoveFromCart = async (itemId: string): Promise<void> => {
    mockCart = mockCart.filter(i => i.id !== itemId);
};

export const dalGetSmartSuggestions = async (): Promise<SmartSuggestion[]> => {
    await new Promise(r => setTimeout(r, 600)); // Simulate AI processing
    const suggestions: SmartSuggestion[] = [];

    mockCart.forEach(cartItem => {
        // 1. CHEAPER ALTERNATIVE CHECK
        // Scenario: User has 'High Grade' PLA (2.50), suggest 'Eco' (1.50)
        if (cartItem.sku === 'MAT-PLA-001') {
            const ecoAlternative = mockInventory.find(i => i.sku === 'MAT-ECO-001');
            if (ecoAlternative) {
                const savingsPerUnit = cartItem.unitPrice - ecoAlternative.unitPrice;
                const totalSavings = savingsPerUnit * cartItem.cartQuantity;
                
                suggestions.push({
                    id: 'sugg_swap_pla',
                    type: 'ALTERNATIVE',
                    originalItemId: cartItem.id,
                    suggestedItem: ecoAlternative,
                    message: "Switching to Eco-Recycled PLA maintains structural integrity for standard prints while reducing cost.",
                    savingsAmount: totalSavings,
                    savingsPercent: Math.round((savingsPerUnit / cartItem.unitPrice) * 100)
                });
            }
        }

        // 2. BUNDLE OPPORTUNITY CHECK
        // Scenario: User has 'Habitat Kit', suggest 'Solar Panel'
        if (cartItem.sku === 'KIT-HAB-SML') {
            const solarAddon = mockInventory.find(i => i.sku === 'ACC-SOL-PNL');
            const hasSolarInCart = mockCart.some(i => i.sku === 'ACC-SOL-PNL');
            
            if (solarAddon && !hasSolarInCart) {
                // Bundle deal: Buy solar with kit, get 5 Pi off
                const discount = 5.0;
                suggestions.push({
                    id: 'sugg_bundle_solar',
                    type: 'BUNDLE',
                    suggestedItem: solarAddon,
                    message: "Optimization: Habitats require power. Bundle a Solar Cell now to save 5 Pi on shipping and assembly.",
                    savingsAmount: discount,
                    savingsPercent: 15 // Approx
                });
            }
        }
    });

    return suggestions;
};

export const dalApplySuggestion = async (suggestion: SmartSuggestion): Promise<void> => {
    if (suggestion.type === 'ALTERNATIVE' && suggestion.originalItemId) {
        // Find quantity of original item
        const original = mockCart.find(i => i.id === suggestion.originalItemId);
        if (original) {
            // Remove original
            mockCart = mockCart.filter(i => i.id !== suggestion.originalItemId);
            // Add new item with same quantity
            await dalAddToCart(suggestion.suggestedItem, original.cartQuantity);
        }
    } else if (suggestion.type === 'BUNDLE') {
        // Add bundled item
        await dalAddToCart(suggestion.suggestedItem, 1);
    }
};

export const dalCheckout = async (): Promise<CheckoutResult> => {
    await new Promise(r => setTimeout(r, 1500)); // Simulate checkout delay

    // 1. Stock Check
    for (const cartItem of mockCart) {
        const stockItem = mockInventory.find(i => i.id === cartItem.id);
        
        // Check for stockout or discrepancies
        if (!stockItem || stockItem.quantity < cartItem.cartQuantity) {
            
            // AI Resolution Search: Find substitute in same category
            const alternative = mockInventory.find(i => 
                i.category === stockItem?.category && 
                i.id !== stockItem?.id && 
                i.quantity >= cartItem.cartQuantity
            );

            let suggestion: SmartSuggestion | undefined;
            if (alternative) {
                const diff = (cartItem.unitPrice - alternative.unitPrice) * cartItem.cartQuantity;
                suggestion = {
                    id: `conflict_sol_${Date.now()}`,
                    type: 'ALTERNATIVE',
                    originalItemId: cartItem.id,
                    suggestedItem: alternative,
                    message: `Critical Stock Alert: '${cartItem.name}' sold out. Instant swap to '${alternative.name}' available.`,
                    savingsAmount: diff,
                    savingsPercent: 0
                };
            }

            return {
                success: false,
                conflict: {
                    conflictingItemId: cartItem.id,
                    itemName: cartItem.name,
                    availableQuantity: stockItem ? stockItem.quantity : 0,
                    requestedQuantity: cartItem.cartQuantity,
                    resolutionSuggestion: suggestion
                }
            };
        }
    }

    // 2. Process Order & Deduct Stock
    mockInventory = mockInventory.map(inv => {
        const inCart = mockCart.find(c => c.id === inv.id);
        if (inCart) {
            // Update quantity
            return { ...inv, quantity: inv.quantity - inCart.cartQuantity };
        }
        return inv;
    });

    // 3. Create Order for Vendor Dashboard
    const newOrder: Order = {
        id: `ORD-${Date.now().toString().substr(-6).toUpperCase()}`,
        customerId: 'PiUser_Alpha',
        customerName: 'Current User', // Mock name
        items: [...mockCart],
        total: mockCart.reduce((sum, item) => sum + (item.unitPrice * item.cartQuantity), 0),
        status: 'PENDING',
        timestamp: Date.now(),
        shippingAddress: '123 Main St, Pi Network City, 00000', // Mock address
        payoutStatus: 'ESCROWED'
    };
    mockOrders.unshift(newOrder);

    mockCart = []; // Clear cart

    return {
        success: true,
        orderId: newOrder.id
    };
};

// --- Messaging Methods ---

export const dalGetConversations = async (): Promise<Conversation[]> => {
    // Sort by latest timestamp
    return [...mockConversations].sort((a, b) => b.lastTimestamp - a.lastTimestamp);
};

export const dalGetMessages = async (contextId: string): Promise<ContextualMessage[]> => {
    return mockMessages.filter(m => m.contextId === contextId).sort((a, b) => a.timestamp - b.timestamp);
};

export const dalSendMessage = async (contextId: string, text: string): Promise<ContextualMessage> => {
    const newMessage: ContextualMessage = {
        id: `msg_${Date.now()}`,
        contextId,
        sender: 'user',
        text,
        timestamp: Date.now(),
        isRead: true
    };
    
    mockMessages.push(newMessage);
    
    // Update conversation meta
    const convIndex = mockConversations.findIndex(c => c.contextId === contextId);
    if (convIndex > -1) {
        mockConversations[convIndex].lastMessage = text;
        mockConversations[convIndex].lastTimestamp = newMessage.timestamp;
    }

    // Simulate Automated System Response for Context
    setTimeout(() => {
        const sysMsg: ContextualMessage = {
            id: `sys_${Date.now()}`,
            contextId,
            sender: 'support',
            text: `[Automated] We received your inquiry regarding context #${contextId.substring(0,6)}. An architect will review your request shortly.`,
            timestamp: Date.now(),
            isRead: false
        };
        mockMessages.push(sysMsg);
        if (convIndex > -1) {
            mockConversations[convIndex].lastMessage = "An architect will review your request shortly.";
            mockConversations[convIndex].lastTimestamp = sysMsg.timestamp;
            mockConversations[convIndex].unreadCount += 1;
        }
    }, 1500);

    return newMessage;
};

export const dalInitializeConversation = async (design: DesignAsset): Promise<string> => {
    // Check if conversation exists
    const existing = mockConversations.find(c => c.contextId === design.id);
    if (existing) return existing.contextId;

    // Create new
    const newConv: Conversation = {
        contextId: design.id,
        contextType: 'DESIGN',
        title: `Inquiry: ${design.title}`,
        lastMessage: 'Conversation started.',
        lastTimestamp: Date.now(),
        unreadCount: 0,
        thumbnailUrl: design.thumbnailUrl
    };
    
    mockConversations.unshift(newConv);
    
    // Initial System Message
    mockMessages.push({
        id: `init_${design.id}`,
        contextId: design.id,
        sender: 'system',
        text: `Context Attached: ${design.title} (${design.format}). Reference ID: ${design.id}.`,
        timestamp: Date.now(),
        isRead: true
    });

    return design.id;
};