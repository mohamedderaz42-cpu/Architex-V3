
import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../components/GlassCard';
import { dalGetVendorProfile, dalSubmitVendorApplication, dalGetVendorOrders, dalUpdateOrderStatus } from '../services/dataAccessLayer';
import { legalService } from '../services/legalService';
import { VendorApplication, Order } from '../types';

export const VendorPortal: React.FC = () => {
    const [vendor, setVendor] = useState<VendorApplication | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Dashboard State
    const [orders, setOrders] = useState<Order[]>([]);
    const [activeTab, setActiveTab] = useState<'ORDERS' | 'SETTINGS'>('ORDERS');
    const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

    // Form State
    const [companyName, setCompanyName] = useState('');
    const [taxId, setTaxId] = useState('');
    const [email, setEmail] = useState('');
    const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
    
    // Immunity Protocol State
    const [waiverSignature, setWaiverSignature] = useState('');
    const [hasReadWaiver, setHasReadWaiver] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadProfile();
    }, []);

    useEffect(() => {
        if (vendor?.status === 'APPROVED') {
            loadOrders();
        }
    }, [vendor?.status]);

    const loadProfile = async () => {
        const profile = await dalGetVendorProfile();
        setVendor(profile);
        if (profile.status !== 'NOT_APPLIED') {
            setCompanyName(profile.companyName);
            setTaxId(profile.taxId);
            setEmail(profile.contactEmail);
            if (profile.waiverSignature) {
                setWaiverSignature(profile.waiverSignature);
                setHasReadWaiver(true);
            }
        }
        setLoading(false);
    };

    const loadOrders = async () => {
        const data = await dalGetVendorOrders();
        setOrders(data);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setInsuranceFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyName || !taxId || !email || (!insuranceFile && vendor?.status === 'NOT_APPLIED')) {
            alert("All fields, including Liability Insurance, are required.");
            return;
        }
        if (!waiverSignature) {
            alert("You must sign the Immunity Protocol waiver to proceed.");
            return;
        }

        setSubmitting(true);

        try {
            let fileData = undefined;
            if (insuranceFile) {
                // Mock File Read
                fileData = {
                    name: insuranceFile.name,
                    data: 'base64_mock_content'
                };
            }

            const updated = await dalSubmitVendorApplication({
                companyName,
                taxId,
                contactEmail: email,
                waiverSigned: true,
                waiverSignature: waiverSignature
            }, fileData);

            setVendor(updated);
            alert("Application Submitted! Status: PENDING review.");
        } catch (e) {
            console.error(e);
            alert("Submission failed.");
        } finally {
            setSubmitting(false);
        }
    };

    // Dev Helper: Force Approve to show Dashboard
    const forceApprove = async () => {
        // This simulates an admin action
        const approvedVendor = { ...vendor!, status: 'APPROVED' as const };
        setVendor(approvedVendor);
        // In real app, we would persist this via DAL
    };

    // Dashboard Actions
    const handleProcessOrder = async (orderId: string) => {
        setProcessingOrderId(orderId);
        await dalUpdateOrderStatus(orderId, 'PROCESSING');
        await loadOrders();
        setProcessingOrderId(null);
    };

    const handleShipOrder = async (orderId: string) => {
        setProcessingOrderId(orderId);
        // Simulate Label Gen
        await new Promise(r => setTimeout(r, 1000));
        const tracking = `TRK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        await dalUpdateOrderStatus(orderId, 'SHIPPED', tracking);
        await loadOrders();
        setProcessingOrderId(null);
    };

    if (loading) return <div className="text-center p-10 animate-pulse text-neon-cyan">Loading Vendor Data...</div>;

    // --- VIEW: APPLICATION FORM (Not Approved) ---
    if (vendor?.status !== 'APPROVED') {
        const isApplied = vendor?.status !== 'NOT_APPLIED';

        return (
            <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-display font-bold text-white">Vendor Portal</h2>
                        <p className="text-gray-400">Manage your business profile and compliance documentation.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            vendor?.status === 'PENDING' ? 'bg-orange-500/20 border-orange-500 text-orange-400' :
                            vendor?.status === 'REJECTED' ? 'bg-red-500/20 border-red-500 text-red-400' :
                            'bg-gray-500/20 border-gray-500 text-gray-400'
                        }`}>
                            STATUS: {vendor?.status}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Application Form */}
                    <div className="lg:col-span-2">
                        <GlassCard className="border-neon-cyan/30">
                            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                                <div className="w-10 h-10 rounded-full bg-neon-cyan/20 flex items-center justify-center border border-neon-cyan/50">
                                    <svg className="w-5 h-5 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-white">
                                    {isApplied ? 'Application Details' : 'New Vendor Application'}
                                </h3>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase font-bold">Company Name</label>
                                        <input 
                                            type="text" 
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            disabled={isApplied}
                                            className="w-full mt-1 bg-black/40 border border-white/10 rounded p-3 text-white focus:border-neon-cyan outline-none disabled:opacity-50"
                                            placeholder="Enter business name"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase font-bold">Tax ID / EIN</label>
                                        <input 
                                            type="text" 
                                            value={taxId}
                                            onChange={(e) => setTaxId(e.target.value)}
                                            disabled={isApplied}
                                            className="w-full mt-1 bg-black/40 border border-white/10 rounded p-3 text-white focus:border-neon-cyan outline-none disabled:opacity-50"
                                            placeholder="XX-XXXXXXX"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Business Email</label>
                                    <input 
                                        type="email" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isApplied}
                                        className="w-full mt-1 bg-black/40 border border-white/10 rounded p-3 text-white focus:border-neon-cyan outline-none disabled:opacity-50"
                                        placeholder="contact@company.com"
                                    />
                                </div>

                                <div className={`p-4 rounded-xl border border-dashed transition-all ${insuranceFile || vendor?.insuranceDoc ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/5 border-red-500/30'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <label className="flex items-center gap-2 text-sm font-bold text-white">
                                            <svg className="w-4 h-4 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                            Liability Insurance Certificate
                                            <span className="text-[10px] bg-red-500 text-white px-1 rounded ml-2">REQUIRED</span>
                                        </label>
                                        {vendor?.insuranceDoc?.verified && (
                                            <span className="text-[10px] text-green-400 font-mono">VERIFIED</span>
                                        )}
                                    </div>
                                    
                                    {isApplied && vendor?.insuranceDoc ? (
                                        <div className="flex items-center gap-3 bg-black/30 p-2 rounded">
                                            <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center">
                                                <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm text-white truncate">{vendor.insuranceDoc.fileName}</div>
                                                <div className="text-[10px] text-gray-500">Uploaded: {new Date(vendor.insuranceDoc.uploadedAt).toLocaleDateString()}</div>
                                            </div>
                                            <button type="button" className="text-xs text-neon-cyan hover:underline">View</button>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-xs text-gray-400 mb-3">
                                                Upload your General Liability Insurance documentation (PDF, JPG). Must be valid for the current fiscal year.
                                            </p>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="file" 
                                                    ref={fileInputRef} 
                                                    onChange={handleFileChange} 
                                                    accept=".pdf,.jpg,.png" 
                                                    className="hidden" 
                                                />
                                                <button 
                                                    type="button" 
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-sm text-white transition-colors"
                                                >
                                                    Select Document
                                                </button>
                                                {insuranceFile && (
                                                    <span className="flex items-center text-sm text-neon-cyan animate-pulse">
                                                        {insuranceFile.name}
                                                    </span>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* DIGITAL IMMUNITY PROTOCOL SECTION */}
                                <div className="border-t border-white/10 pt-6 mt-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-2xl">🛡️</span>
                                        <h4 className="text-lg font-bold text-white">Immunity Protocol</h4>
                                    </div>
                                    
                                    <div className="bg-black/40 border border-white/10 rounded-lg p-4 mb-4 max-h-40 overflow-y-auto text-xs text-gray-300 font-mono leading-relaxed">
                                        {legalService.getVendorImmunityWaiver()}
                                    </div>

                                    <div className="space-y-3">
                                        <label className="flex items-start gap-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={hasReadWaiver}
                                                onChange={(e) => setHasReadWaiver(e.target.checked)}
                                                disabled={isApplied}
                                                className="mt-1 accent-neon-cyan"
                                            />
                                            <span className="text-xs text-gray-400">
                                                I have read and understand that Architex is strictly a Venue and holds no liability for my independent sales operations.
                                            </span>
                                        </label>

                                        <div>
                                            <label className="text-xs text-gray-500 uppercase font-bold">Cryptographic Signature</label>
                                            <input 
                                                type="text" 
                                                value={waiverSignature}
                                                onChange={(e) => setWaiverSignature(e.target.value)}
                                                disabled={!hasReadWaiver || isApplied}
                                                placeholder="Type Full Name to Sign"
                                                className="w-full mt-1 bg-black/40 border border-white/10 rounded p-3 text-white font-serif italic outline-none focus:border-neon-cyan disabled:opacity-50"
                                            />
                                            <p className="text-[10px] text-gray-500 mt-1">This signature is recorded on the immutable ledger.</p>
                                        </div>
                                    </div>
                                </div>

                                {!isApplied && (
                                    <button 
                                        type="submit" 
                                        disabled={submitting || !waiverSignature || !hasReadWaiver}
                                        className="w-full py-4 bg-gradient-to-r from-neon-purple to-neon-cyan text-black font-bold rounded-lg hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                                    >
                                        {submitting ? (
                                            <>Processing...</>
                                        ) : (
                                            <>Submit Application</>
                                        )}
                                    </button>
                                )}
                                
                                {isApplied && vendor?.status === 'PENDING' && (
                                    <div className="flex justify-between items-center mt-4">
                                         <div className="text-sm text-orange-400 bg-orange-500/10 p-2 rounded flex-1 mr-4">
                                            Your application is currently under review by the Architex Compliance Team.
                                        </div>
                                        {/* DEV HELPER FOR DEMO */}
                                        <button type="button" onClick={forceApprove} className="text-xs bg-white/5 border border-white/10 px-2 py-1 rounded text-gray-500 hover:text-white">
                                            Dev: Force Approve
                                        </button>
                                    </div>
                                )}
                            </form>
                        </GlassCard>
                    </div>

                    {/* Info / Benefits Sidebar */}
                    <div className="space-y-6">
                        <GlassCard title="Vendor Benefits">
                            <ul className="space-y-3 text-sm text-gray-300">
                                <li className="flex gap-2">
                                    <span className="text-green-400">✓</span>
                                    <span>Access to Enterprise Bounties (>500 Pi)</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-green-400">✓</span>
                                    <span>Verified Merchant Badge</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-green-400">✓</span>
                                    <span>Reduced Platform Fees (3%)</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-green-400">✓</span>
                                    <span>Direct Treasury Payouts</span>
                                </li>
                            </ul>
                        </GlassCard>

                        <GlassCard className="bg-gradient-to-br from-blue-900/40 to-black">
                            <h4 className="font-bold text-white mb-2">Insurance Requirements</h4>
                            <p className="text-xs text-gray-400 mb-4">
                                To ensure platform safety, all vendors must carry valid General Liability Insurance with a minimum coverage of $1,000,000 (or Pi equivalent).
                            </p>
                            <div className="text-[10px] text-gray-500 font-mono">
                                REF: POLICY-2024-VEND-01
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </div>
        );
    }

    // --- VIEW: FULFILLMENT DASHBOARD (Approved) ---
    const deliveredCount = orders.filter(o => o.status === 'DELIVERED').length;
    const pendingCount = orders.filter(o => o.status === 'PENDING').length;
    const revenue = orders.filter(o => o.status !== 'PENDING').reduce((acc, curr) => acc + curr.total, 0);

    return (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-display font-bold text-white">Command Center</h2>
                    <p className="text-gray-400 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        {vendor.companyName} Fulfillment System
                    </p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setActiveTab('ORDERS')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${activeTab === 'ORDERS' ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan' : 'bg-white/5 border-white/10 text-gray-400'}`}
                    >
                        Orders
                    </button>
                    <button 
                        onClick={() => setActiveTab('SETTINGS')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${activeTab === 'SETTINGS' ? 'bg-neon-purple/20 border-neon-purple text-neon-purple' : 'bg-white/5 border-white/10 text-gray-400'}`}
                    >
                        Store Settings
                    </button>
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <GlassCard className="border-neon-cyan/30">
                    <div className="text-xs text-gray-400 uppercase font-bold">Total Revenue</div>
                    <div className="text-2xl font-mono font-bold text-white">{revenue.toFixed(2)} Pi</div>
                    <div className="text-[10px] text-gray-500 mt-1">Processed orders only</div>
                </GlassCard>
                <GlassCard className="border-white/10">
                    <div className="text-xs text-gray-400 uppercase font-bold">Pending Actions</div>
                    <div className={`text-2xl font-mono font-bold ${pendingCount > 0 ? 'text-orange-400 animate-pulse' : 'text-gray-200'}`}>{pendingCount}</div>
                </GlassCard>
                <GlassCard className="border-white/10">
                    <div className="text-xs text-gray-400 uppercase font-bold">Delivered</div>
                    <div className="text-2xl font-mono font-bold text-green-400">{deliveredCount}</div>
                </GlassCard>
                <GlassCard className="border-white/10">
                    <div className="text-xs text-gray-400 uppercase font-bold">Fulfillment Rate</div>
                    <div className="text-2xl font-mono font-bold text-neon-purple">98.2%</div>
                </GlassCard>
            </div>

            {activeTab === 'ORDERS' ? (
                <div className="space-y-4">
                    {orders.length === 0 ? (
                         <div className="p-10 border border-dashed border-white/10 rounded-xl text-center text-gray-500">
                             No orders received yet.
                         </div>
                    ) : (
                        orders.map(order => (
                            <GlassCard key={order.id} className="relative group hover:border-white/20 transition-all">
                                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                    {/* Order Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-bold text-white text-lg">{order.id}</h3>
                                            <span className={`px-2 py-0.5 text-[10px] rounded font-bold border ${
                                                order.status === 'PENDING' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                                                order.status === 'PROCESSING' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                                order.status === 'SHIPPED' ? 'bg-neon-purple/20 text-neon-purple border-neon-purple/30' :
                                                'bg-green-500/20 text-green-400 border-green-500/30'
                                            }`}>
                                                {order.status}
                                            </span>
                                            {/* Payout Status Indicator */}
                                            {(order.payoutStatus === 'RELEASED' || order.payoutStatus === 'AUTO_RELEASED') && (
                                                <span className="text-[10px] flex items-center gap-1 bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20 animate-pulse">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    {order.payoutStatus === 'AUTO_RELEASED' ? 'Auto-Released' : 'Funds Released'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-400 mb-1">
                                            Customer: <span className="text-white">{order.customerName}</span> ({order.customerId})
                                        </div>
                                        <div className="text-xs text-gray-500 font-mono">
                                            {new Date(order.timestamp).toLocaleString()}
                                        </div>
                                        
                                        {/* Address Collapsed/Expanded Logic could go here, simply showing line item for now */}
                                        <div className="mt-3 text-xs text-gray-300 bg-white/5 p-2 rounded inline-block max-w-md truncate">
                                            📍 {order.shippingAddress}
                                        </div>

                                        {/* Tracking Info */}
                                        {order.trackingNumber && (
                                            <div className="mt-2 text-xs text-neon-cyan font-mono">
                                                Tracking: {order.trackingNumber}
                                            </div>
                                        )}
                                    </div>

                                    {/* Items Summary */}
                                    <div className="flex-1 border-l border-white/10 pl-4">
                                        <div className="text-xs text-gray-500 uppercase mb-2">Order Contents</div>
                                        <div className="space-y-1">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between text-sm">
                                                    <span className="text-gray-300">{item.cartQuantity}x {item.name}</span>
                                                    <span className="text-gray-500 font-mono">{(item.unitPrice * item.cartQuantity).toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-2 pt-2 border-t border-white/5 flex justify-between font-bold text-white">
                                            <span>Total</span>
                                            <span className="text-neon-cyan">{order.total.toFixed(2)} Pi</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="w-full md:w-auto flex flex-col gap-2 min-w-[140px]">
                                        {order.status === 'PENDING' && (
                                            <button 
                                                onClick={() => handleProcessOrder(order.id)}
                                                disabled={processingOrderId === order.id}
                                                className="px-4 py-2 bg-blue-500/20 text-blue-300 border border-blue-500/50 rounded-lg text-sm font-bold hover:bg-blue-500/30 transition-all"
                                            >
                                                {processingOrderId === order.id ? 'Updating...' : 'Process Order'}
                                            </button>
                                        )}
                                        {order.status === 'PROCESSING' && (
                                            <button 
                                                onClick={() => handleShipOrder(order.id)}
                                                disabled={processingOrderId === order.id}
                                                className="px-4 py-2 bg-neon-purple/20 text-neon-purple border border-neon-purple/50 rounded-lg text-sm font-bold hover:bg-neon-purple/30 transition-all shadow-[0_0_15px_rgba(124,58,237,0.2)]"
                                            >
                                                 {processingOrderId === order.id ? 'Generating...' : 'Generate Label'}
                                            </button>
                                        )}
                                        {order.status === 'SHIPPED' && (
                                            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-center text-xs text-gray-500">
                                                Awaiting Delivery
                                            </div>
                                        )}
                                        {order.status === 'DELIVERED' && (
                                             <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-lg text-center text-xs text-green-400 font-bold">
                                                Completed
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </GlassCard>
                        ))
                    )}
                </div>
            ) : (
                <GlassCard title="Store Settings">
                    <div className="text-gray-400">Settings panel coming soon...</div>
                </GlassCard>
            )}
        </div>
    );
};
