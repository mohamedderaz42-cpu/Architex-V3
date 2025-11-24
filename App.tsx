















import React, { useState, useEffect } from 'react';
import { ViewState, UserSession } from './types';
import { Dashboard } from './features/Dashboard';
import { Whitepaper } from './features/Whitepaper';
import { Scanner } from './features/Scanner';
import { BlueprintStore } from './features/BlueprintStore';
import { Gallery } from './features/Gallery';
import { UserProfile } from './features/UserProfile';
import { AdminPanel } from './features/AdminPanel';
import { Messages } from './features/Messages'; // Import Messages
import { DeFiDashboard } from './features/DeFiDashboard'; // Import DeFi
import { BountyMarketplace } from './features/BountyMarketplace'; // Import Bounty
import { NFTFactory } from './features/NFTFactory'; // Import NFT Factory
import { StakingVault } from './features/StakingVault'; // Import Staking
import { LegalEngine } from './features/LegalEngine'; // Import Legal Engine
import { VendorPortal } from './features/VendorPortal'; // Import Vendor Portal
import { InventoryLedger } from './features/InventoryLedger'; // Import Inventory
import { ShippingZones } from './features/ShippingZones'; // Import Shipping
import { SmartCart } from './features/SmartCart'; // Import Smart Cart
import { ServiceNetwork } from './features/ServiceNetwork'; // Import Service Network
import { DisputeConsole } from './features/DisputeConsole'; // Import Dispute Console
import { GovernanceDAO } from './features/GovernanceDAO'; // Import DAO
import { DesignChallenges } from './features/DesignChallenges'; // Import Challenges
import { EnterprisePortal } from './features/EnterprisePortal'; // Import Enterprise Portal
import { CarbonCalculator } from './features/CarbonCalculator'; // Import Calculator
import { GlassCard } from './components/GlassCard';
import { ArchieBot } from './components/ArchieBot';
import { initializeSession, handleAddTrustline } from './services/orchestrator';
import { adsService } from './services/adsService'; // Import Ads Service
import { dalGetCart } from './services/dataAccessLayer'; // Import Cart Access for Badge
import { UI_CONSTANTS } from './constants';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeContextId, setActiveContextId] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    init();
    // Initialize Ads SDK on mount
    adsService.init();
  }, []);

  // Poll for cart updates (Mock approach, normally would use context/subscription)
  useEffect(() => {
    const updateCartCount = async () => {
        const items = await dalGetCart();
        const count = items.reduce((acc, item) => acc + item.cartQuantity, 0);
        setCartCount(count);
    };
    updateCartCount();
    const interval = setInterval(updateCartCount, 2000);
    return () => clearInterval(interval);
  }, []);

  const init = async () => {
    setLoading(true);
    const userSession = await initializeSession();
    setSession(userSession);
    setLoading(false);
  };

  const onAddTrustline = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const updatedSession = await handleAddTrustline(session);
      setSession(updatedSession);
    } catch (e) {
      alert("Failed to activate wallet.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = (contextId: string) => {
      setActiveContextId(contextId);
      setView(ViewState.MESSAGES);
  };

  const handleNavigation = (target: ViewState) => {
      // Ad Integration: Show ad when navigating to Blueprint Store if user is Free Tier
      if (target === ViewState.BLUEPRINTS) {
          adsService.showAd(session, "interstitial");
      }
      
      setView(target);
      if (target !== ViewState.MESSAGES) setActiveContextId(null);
  };

  const NavItem = ({ label, target }: { label: string; target: ViewState }) => (
    <button
      onClick={() => handleNavigation(target)}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        view === target ? 'bg-neon-purple/20 text-neon-cyan border border-neon-purple/50' : 'text-gray-400 hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen font-sans text-white p-4 pb-24 md:p-8 max-w-7xl mx-auto">
      {/* Header / Navbar */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView(ViewState.DASHBOARD)}>
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
            <span className="font-display font-bold text-xl">A</span>
          </div>
          <span className="font-display font-bold text-2xl tracking-wide">ARCHITEX</span>
        </div>

        <nav className="flex gap-2 bg-white/5 p-1 rounded-xl backdrop-blur-md border border-white/10 flex-wrap justify-center">
          <NavItem label="Dashboard" target={ViewState.DASHBOARD} />
          <NavItem label="DeFi" target={ViewState.DEFI} />
          <NavItem label="Staking" target={ViewState.STAKING} />
          <NavItem label="Bounties" target={ViewState.BOUNTIES} />
          <NavItem label="Store" target={ViewState.BLUEPRINTS} />
          
          {/* Vendor Group */}
          <div className="w-px h-6 bg-white/20 mx-1 self-center hidden md:block"></div>
          <NavItem label="Stock" target={ViewState.INVENTORY} />
          <NavItem label="Calculator" target={ViewState.CALCULATOR} />
          
          {/* Cart Icon */}
          <button 
            onClick={() => handleNavigation(ViewState.CART)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                view === ViewState.CART ? 'bg-neon-purple/20 text-neon-cyan border border-neon-purple/50' : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>Cart</span>
            {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-neon-pink rounded-full text-[10px] flex items-center justify-center text-white font-bold">
                    {cartCount}
                </span>
            )}
          </button>
          
          <div className="w-px h-6 bg-white/20 mx-1 self-center hidden md:block"></div>
          <NavItem label="Enterprise" target={ViewState.ENTERPRISE_PORTAL} />
          <NavItem label="DAO" target={ViewState.GOVERNANCE} /> 
          <NavItem label="Disputes" target={ViewState.DISPUTES} />
          <NavItem label="Challenges" target={ViewState.CHALLENGES} /> 
        </nav>

        {/* User Status */}
        <div className="flex items-center gap-3">
             {loading ? (
                 <div className="h-2 w-20 bg-white/10 animate-pulse rounded"></div>
             ) : session?.isAuthenticated ? (
                 <button 
                    onClick={() => setView(ViewState.PROFILE)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all ${view === ViewState.PROFILE ? 'bg-neon-cyan/20 border-neon-cyan' : 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20'}`}
                 >
                    <img src={session.avatarUrl} alt="Avatar" className="w-6 h-6 rounded-full" />
                    <span className={`text-xs font-mono ${view === ViewState.PROFILE ? 'text-neon-cyan' : 'text-green-400'}`}>{session.username}</span>
                    {session.tier !== 'FREE' && (
                        <span className="text-[10px] bg-yellow-500 text-black px-1 rounded font-bold">{session.tier}</span>
                    )}
                 </button>
             ) : (
                 <button className="text-sm text-neon-cyan">Connect Pi</button>
             )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="animate-[fadeIn_0.5s_ease-out]">
        {view === ViewState.DASHBOARD && <Dashboard />}
        {view === ViewState.WHITEPAPER && <Whitepaper />}
        {view === ViewState.SCANNER && <Scanner onNavigateToBlueprints={() => handleNavigation(ViewState.BLUEPRINTS)} />}
        {view === ViewState.BLUEPRINTS && <BlueprintStore onOpenChat={handleOpenChat} />}
        {view === ViewState.GALLERY && <Gallery />}
        {view === ViewState.MESSAGES && <Messages initialContextId={activeContextId} />}
        {view === ViewState.PROFILE && session && <UserProfile session={session} onRefresh={init} />}
        {view === ViewState.DEFI && <DeFiDashboard />}
        {view === ViewState.BOUNTIES && <BountyMarketplace />}
        {view === ViewState.NFT_FACTORY && <NFTFactory />}
        {view === ViewState.STAKING && <StakingVault />}
        {view === ViewState.LEGAL && <LegalEngine />}
        {view === ViewState.VENDOR_PORTAL && <VendorPortal />}
        {view === ViewState.INVENTORY && <InventoryLedger />}
        {view === ViewState.SHIPPING && <ShippingZones />}
        {view === ViewState.CART && <SmartCart />}
        {view === ViewState.SERVICES && <ServiceNetwork />}
        {view === ViewState.DISPUTES && <DisputeConsole />}
        {view === ViewState.GOVERNANCE && session && <GovernanceDAO session={session} />}
        {view === ViewState.CHALLENGES && <DesignChallenges />}
        {view === ViewState.ENTERPRISE_PORTAL && <EnterprisePortal />}
        {view === ViewState.CALCULATOR && <CarbonCalculator />}
        
        {/* Admin Views */}
        {(view === ViewState.ADMIN_LOGIN || view === ViewState.ADMIN_PANEL) && (
            <AdminPanel onLogout={() => setView(ViewState.DASHBOARD)} />
        )}
        
        {view === ViewState.WALLET && (
          <div className="max-w-2xl mx-auto space-y-6">
            <GlassCard title="Wallet Asset Management" glow>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <div className="text-gray-400 text-sm">Available Balance</div>
                  <div className="text-4xl font-mono font-bold mt-1">
                    {session?.balance.toFixed(2)} <span className="text-neon-cyan text-lg">ARTX</span>
                  </div>
                </div>
                <div className="text-right">
                   <div className="text-gray-400 text-sm">Status</div>
                   <div className={`text-sm font-bold ${session?.hasTrustline ? 'text-green-400' : 'text-orange-400'}`}>
                     {session?.hasTrustline ? 'Active' : 'Activation Pending'}
                   </div>
                </div>
              </div>

              {!session?.hasTrustline && (
                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg mb-6">
                  <p className="text-orange-200 text-sm mb-3">
                    Your wallet needs to be activated to receive ARTX tokens.
                  </p>
                  <button 
                    onClick={onAddTrustline}
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 rounded font-bold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {loading ? 'Processing on Pi Network...' : 'Activate Wallet (1 Pi Reserve)'}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <button className="py-3 bg-white/5 border border-white/10 rounded hover:bg-white/10 transition-colors">
                  Receive
                </button>
                <button className="py-3 bg-white/5 border border-white/10 rounded hover:bg-white/10 transition-colors">
                  Send
                </button>
              </div>
            </GlassCard>
            
            <div className="flex justify-center">
                <button onClick={() => setView(ViewState.DEFI)} className="text-neon-cyan text-sm underline">
                    Go to DeFi Gateway & Exchange
                </button>
            </div>
          </div>
        )}
      </main>

      {/* AI Companion - Now Context Aware */}
      <ArchieBot currentView={view} />

      {/* Footer */}
      <footer className="mt-20 border-t border-white/5 pt-8 text-center text-gray-500 text-xs">
        <p>© 2024 Architex Protocol. Built on Pi Network.</p>
        <p className="mt-2 font-mono">v1.0.0-alpha | Pi Testnet</p>
        <div className="mt-4">
            <button 
                onClick={() => setView(ViewState.ADMIN_LOGIN)}
                className="text-gray-700 hover:text-gray-500 transition-colors text-[10px] uppercase tracking-widest"
            >
                Admin Access
            </button>
        </div>
      </footer>
    </div>
  );
};

export default App;