
import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { CartItem, SmartSuggestion, CheckoutResult } from '../types';
import { dalGetCart, dalGetSmartSuggestions, dalApplySuggestion, dalRemoveFromCart, dalCheckout } from '../services/dataAccessLayer';

export const SmartCart: React.FC = () => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    
    // Checkout State
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [conflict, setConflict] = useState<CheckoutResult['conflict'] | null>(null);
    
    // Phase 5: Shipping Liability Shield
    const [liabilityReleased, setLiabilityReleased] = useState(false);

    useEffect(() => {
        loadCart();
    }, []);

    const loadCart = async () => {
        setLoading(true);
        const cartItems = await dalGetCart();
        setCart(cartItems);
        setLoading(false);
        
        // Trigger AI Analysis if cart has items
        if (cartItems.length > 0) {
            setAnalyzing(true);
            const suggs = await dalGetSmartSuggestions();
            setSuggestions(suggs);
            setAnalyzing(false);
        } else {
            setSuggestions([]);
        }
    };

    const handleApplySuggestion = async (s: SmartSuggestion) => {
        setAnalyzing(true); // Re-use analyzing state for processing visual
        await dalApplySuggestion(s);
        await loadCart(); // Reload cart and re-analyze
    };

    const handleRemoveItem = async (id: string) => {
        await dalRemoveFromCart(id);
        loadCart();
    };
    
    const handleCheckout = async () => {
        if (!liabilityReleased) {
            alert("You must accept the shipping liability waiver to proceed.");
            return;
        }
        setIsCheckingOut(true);
        setConflict(null);
        
        try {
            const result = await dalCheckout(liabilityReleased);
            
            if (result.success) {
                if (result.status === 'PENDING_VERIFICATION') {
                    alert(`Order Placed but Pending Verification (ID: ${result.orderId}).\n\nReason: Inventory Conflict Detected.\n\nThe Blockchain Timestamp is arbitrating the final stock allocation. Check your Order History in a few seconds.`);
                } else {
                    alert(`Order Successfully Placed! ID: ${result.orderId}`);
                }
                loadCart(); // Should be empty
                setLiabilityReleased(false);
            } else if (result.conflict) {
                // Trigger conflict modal
                setConflict(result.conflict);
            }
        } catch (e) {
            alert("Checkout System Error");
        } finally {
            setIsCheckingOut(false);
        }
    };

    const resolveConflict = async (acceptSwap: boolean) => {
        if (!conflict) return;

        if (acceptSwap && conflict.resolutionSuggestion) {
            await dalApplySuggestion(conflict.resolutionSuggestion);
        } else {
            // If not swapping, remove the conflicting item
            await dalRemoveFromCart(conflict.conflictingItemId);
        }
        
        setConflict(null);
        loadCart(); // Refresh cart UI to reflect change
    };

    const subtotal = cart.reduce((acc, item) => acc + (item.unitPrice * item.cartQuantity), 0);
    const potentialSavings = suggestions.reduce((acc, s) => acc + s.savingsAmount, 0);

    return (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out] relative">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-display font-bold text-white">Smart Cart</h2>
                    <p className="text-gray-400">ArchieBot analyzes your basket for savings and bundle opportunities.</p>
                </div>
                <div className="text-right">
                    <div className="text-xs text-gray-500 uppercase">Cart Total</div>
                    <div className="text-3xl font-mono font-bold text-white">{subtotal.toFixed(2)} Pi</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                    {loading ? (
                        <div className="p-10 text-center text-gray-500 bg-white/5 rounded-xl animate-pulse">Loading Cart...</div>
                    ) : cart.length === 0 ? (
                        <div className="p-10 text-center border border-dashed border-white/10 rounded-xl">
                            <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            <p className="text-gray-400">Your cart is empty.</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <GlassCard key={item.id} className="flex justify-between items-center relative overflow-hidden group">
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-12 h-12 bg-white/5 rounded flex items-center justify-center font-bold text-gray-400">
                                        {item.cartQuantity}x
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white flex items-center gap-2">
                                            {item.name}
                                            {item.co2PerUnit !== undefined && item.co2PerUnit < 2.0 && (
                                                <span className="text-[8px] px-1.5 py-0.5 bg-green-500 text-black rounded font-bold" title="Low Carbon Footprint">ECO</span>
                                            )}
                                        </h4>
                                        <p className="text-xs text-gray-400 font-mono">{item.sku}</p>
                                        
                                        {item.sustainabilityTags && item.sustainabilityTags.length > 0 && (
                                            <div className="flex gap-1 mt-1">
                                                {item.sustainabilityTags.map((tag, i) => (
                                                    <span key={i} className="text-[9px] text-neon-cyan border border-neon-cyan/30 px-1 rounded">{tag}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right flex items-center gap-6 relative z-10">
                                    <div>
                                        <div className="font-bold text-neon-cyan">{item.unitPrice.toFixed(2)} Pi</div>
                                        <div className="text-[10px] text-gray-500">per unit</div>
                                    </div>
                                    <button 
                                        onClick={() => handleRemoveItem(item.id)}
                                        className="text-gray-500 hover:text-red-400"
                                    >
                                        &times;
                                    </button>
                                </div>
                            </GlassCard>
                        ))
                    )}
                </div>

                {/* Right Col: AI Suggestions & Checkout */}
                <div className="space-y-4">
                    <GlassCard className="bg-gradient-to-br from-neon-purple/10 to-black border-neon-purple/50">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-neon-purple flex items-center justify-center shadow-lg shadow-neon-purple/50">
                                <span className="text-sm">🤖</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Archie's Insights</h3>
                                <p className="text-[10px] text-neon-purple uppercase tracking-widest">Optimization Engine</p>
                            </div>
                        </div>

                        {analyzing ? (
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <span className="w-2 h-2 bg-neon-purple rounded-full animate-ping"></span>
                                Analyzing SKU compatibility & carbon impact...
                            </div>
                        ) : suggestions.length > 0 ? (
                            <div className="space-y-4">
                                {suggestions.map(s => (
                                    <div key={s.id} className={`bg-black/40 border rounded-lg p-3 animate-[slideUp_0.3s_ease-out] ${
                                        s.type === 'ECO_UPGRADE' ? 'border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 'border-white/10'
                                    }`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                                s.type === 'ALTERNATIVE' ? 'bg-blue-500/20 text-blue-400' : 
                                                s.type === 'ECO_UPGRADE' ? 'bg-green-500 text-black' :
                                                'bg-purple-500/20 text-purple-400'
                                            }`}>
                                                {s.type === 'ALTERNATIVE' ? 'CHEAPER SWAP' : s.type === 'ECO_UPGRADE' ? 'SUSTAINABILITY BOOST' : 'BUNDLE DEAL'}
                                            </span>
                                            {s.savingsAmount > 0 && (
                                                <span className="text-green-400 font-bold text-xs">
                                                    SAVE {s.savingsAmount.toFixed(2)} Pi
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-300 mb-3 leading-relaxed">
                                            "{s.message}"
                                        </p>
                                        <button 
                                            onClick={() => handleApplySuggestion(s)}
                                            className="w-full py-2 bg-white/5 hover:bg-neon-purple/20 border border-white/10 hover:border-neon-purple/50 rounded text-xs font-bold text-white transition-all"
                                        >
                                            Apply {s.type === 'ECO_UPGRADE' ? 'Eco-Swap' : s.type === 'ALTERNATIVE' ? 'Swap' : 'Bundle'}
                                        </button>
                                    </div>
                                ))}
                                <div className="pt-2 border-t border-white/5 text-center">
                                    <p className="text-xs text-gray-400">Total Potential Savings: <span className="text-green-400 font-bold">{potentialSavings.toFixed(2)} Pi</span></p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-gray-500 text-center italic">
                                No optimizations found for current selection. Cart is optimal.
                            </p>
                        )}
                    </GlassCard>

                    {/* Shipping Liability Shield */}
                    {cart.length > 0 && (
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={liabilityReleased}
                                    onChange={(e) => setLiabilityReleased(e.target.checked)}
                                    className="mt-1 accent-neon-cyan"
                                />
                                <div className="text-xs text-gray-300">
                                    <span className="font-bold text-white block mb-1">Shipping Liability Release</span>
                                    I release Architex from all shipping liability. I understand that delivery is the sole responsibility of the independent vendor.
                                </div>
                            </label>
                        </div>
                    )}

                    <button 
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || isCheckingOut || !liabilityReleased}
                        className="w-full py-4 bg-gradient-to-r from-neon-purple to-pink-600 rounded-lg font-bold text-white shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                    >
                        {isCheckingOut ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                <span>Verifying Stock...</span>
                            </>
                        ) : (
                            <span>Checkout Now</span>
                        )}
                    </button>
                </div>
            </div>

            {/* Conflict Resolution Modal */}
            {conflict && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
                    <GlassCard className="max-w-md w-full !border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.3)]">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-red-500/50">
                                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <h3 className="text-xl font-display font-bold text-white">Stock Conflict Detected</h3>
                            <p className="text-gray-400 text-sm mt-1">
                                We ran out of <span className="text-white font-bold">{conflict.itemName}</span> during your session.
                            </p>
                            <div className="mt-2 text-xs text-red-400 bg-red-500/10 py-1 px-3 rounded inline-block">
                                Requested: {conflict.requestedQuantity} | Available: {conflict.availableQuantity}
                            </div>
                        </div>

                        {conflict.resolutionSuggestion ? (
                            <div className="bg-gradient-to-r from-neon-purple/10 to-blue-500/10 border border-neon-purple/30 rounded-xl p-4 mb-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-1 bg-neon-purple text-[8px] font-bold text-black rounded-bl">ARCHIE'S FIX</div>
                                <h4 className="text-sm font-bold text-neon-cyan mb-2">Smart Swap Recommendation</h4>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="flex-1">
                                        <div className="text-xs text-gray-500 line-through">{conflict.itemName}</div>
                                        <div className="text-sm font-bold text-white">
                                            {conflict.resolutionSuggestion.suggestedItem.name}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-green-400 font-bold">In Stock</div>
                                        <div className="text-[10px] text-gray-500">{conflict.resolutionSuggestion.suggestedItem.sku}</div>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-300 italic">
                                    "{conflict.resolutionSuggestion.message}"
                                </p>
                            </div>
                        ) : (
                            <div className="p-4 bg-white/5 rounded-xl text-center text-sm text-gray-400 mb-6">
                                No direct alternatives found. Please remove this item to proceed.
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => resolveConflict(false)}
                                className="py-3 border border-red-500/30 text-red-400 rounded-lg font-bold text-sm hover:bg-red-500/10 transition-colors"
                            >
                                Remove Item
                            </button>
                            {conflict.resolutionSuggestion && (
                                <button 
                                    onClick={() => resolveConflict(true)}
                                    className="py-3 bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan rounded-lg font-bold text-sm hover:bg-neon-cyan/30 transition-colors shadow-[0_0_15px_rgba(0,243,255,0.2)]"
                                >
                                    Accept Auto-Swap
                                </button>
                            )}
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};
