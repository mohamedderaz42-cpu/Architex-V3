


import React, { useState, useEffect } from 'react';
import { ViewState, UserSession, SystemMode } from './types';
import { Dashboard } from './features/Dashboard';
import { Whitepaper } from './features/Whitepaper';
import { Scanner } from './features/Scanner';
import { BlueprintStore } from './features/BlueprintStore';
import { Gallery } from './features/Gallery';
import { UserProfile } from './features/UserProfile';
import { AdminPanel } from './features/AdminPanel';
import { Messages } from './features/Messages';
import { DeFiDashboard } from './features/DeFiDashboard';
import { BountyMarketplace } from './features/BountyMarketplace';
import { NFTFactory } from './features/NFTFactory';
import { StakingVault } from './features/StakingVault';
import { LegalEngine } from './features/LegalEngine';
import { VendorPortal } from './features/VendorPortal';
import { InventoryLedger } from './features/InventoryLedger';
import { ShippingZones } from './features/ShippingZones';
import { SmartCart } from './features/SmartCart';
import { ServiceNetwork } from './features/ServiceNetwork';
import { DisputeConsole } from './features/DisputeConsole';
import { GovernanceDAO } from './features/GovernanceDAO';
import { DesignChallenges } from './features/DesignChallenges';
import { EnterprisePortal } from './features/EnterprisePortal';
import { CarbonCalculator } from './features/CarbonCalculator';
import { ArchitexGo } from './features/ArchitexGo';
import { GlassCard } from './components/GlassCard';
import { ArchieBot } from './components/ArchieBot';
import { initializeSession, handleAddTrustline } from './services/orchestrator';
import { adsService } from './services/adsService';
import { dalGetCart } from './services/dataAccessLayer';
import { systemConfigService } from './services/adminService'; // Import for mode check
import { UI_CONSTANTS } from './constants';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeContextId, setActiveContextId] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);
  
  // Phase 11: Beta Gate Logic
  const [appMode, setAppMode] = useState<SystemMode>('BETA'); // Default to blocked until fetch
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    init();
    adsService.init();
  }, []);

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
    
    // Check App Mode
    const mode = await systemConfigService.getSystemMode();
    setAppMode(mode);

    // Beta Gate Check
    if (mode === 'BETA') {
        if (!userSession.isAuthenticated || !userSession.isWhitelisted) {
            setAccessDenied(true);
        } else {
            setAccessDenied(false);
        }
    } else {
        setAccessDenied(false);
    }

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

  // ADMIN OVERRIDE: If user clicks "Admin Access" in Beta screen
  const forceAdminLogin = () => {
      setAccessDenied(false);
      setView(ViewState.ADMIN_LOGIN);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-neon-cyan animate-pulse">Initializing Protocol...</div>;

  // BETA GATE SCREEN
  if (accessDenied && view !== ViewState.ADMIN_LOGIN) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
              {/* Background Visuals */}
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/20 to-blue-900/20"></div>
              <div className="absolute inset-0 grid grid-cols-[repeat(20,1fr)] opacity-10">
                  {Array.from({length: 400}).map((_,i) => <div key={i} className="border border-white/5"></div>)}
              </div>

              <GlassCard className="max-w-lg w-full p-10 text-center border-neon-purple/50 relative z-10 shadow-[0_0_100px_rgba(124,58,237,0.2)]">
                  <div className="w-20 h-20 mx-auto mb-6 bg-neon-purple/10 rounded-full flex items-center justify-center border border-neon-purple shadow-lg shadow-neon-purple/50">
                      <span className="text-4xl">🔒</span>
                  </div>
                  <h1 className="text-4xl font-display font-bold text-white mb-2">Closed Beta</h1>
                  <div className="h-1 w-20 bg-neon-purple mx-auto mb-6"></div>
                  <p className="text-gray-300 mb-8 leading-relaxed">
                      Architex is currently conducting final security audits and stress tests. Access is restricted to whitelisted wallet addresses only.
                  </p>
                  <div className="bg-black/40 p-4 rounded-lg border border-white/10 mb-8">
                      <p className="text-xs text-gray-500 uppercase mb-1">Your Identity</p>
                      <p className="text-neon-cyan font-mono text-sm">{session?.username}</p>
                      <p className="text-red-400 text-xs mt-2 font-bold">NOT WHITELISTED</p>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                      <button className="w-full py-3 border border-white/20 rounded text-gray-400 hover:text-white hover:border-white/40 transition-all">
                          Check Back Later
                      </button>
                      <button onClick={forceAdminLogin} className="text-xs text-gray-600 hover:text-gray-400 mt-4">
                          Administrator Login
                      </button>
                  </div>
              </GlassCard>
          </div>
      );
  }

  return (
    <div className="min-h-screen font-sans text-white p-4 pb-24 md:p-8 max-w-7xl mx-auto relative">
      {/* App Mode Indicator */}
      {appMode !== 'LIVE' && (
          <div className={`fixed top-0 left-0 right-0 h-1 z-50 ${appMode === 'BETA' ? 'bg-neon-purple' : 'bg-yellow-500'}`}></div>
      )}

      {/* Header / Navbar */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView(ViewState.DASHBOARD)}>
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
            <span className="font-display font-bold text-xl">A</span>
          </div>
          <div className="flex flex-col">
              <span className="font-display font-bold text-2xl tracking-wide">ARCHITEX</span>
              {appMode !== 'LIVE' && <span className="text-[10px] font-mono text-neon-purple tracking-widest uppercase">{appMode} ENVIRONMENT</span>}
          </div>
        </div>

        <nav className="flex gap-2 bg-white/5 p-1 rounded-xl backdrop-blur-md border border-white/10 flex-wrap justify-center">
          <NavItem label="Dashboard" target={ViewState.DASHBOARD} />
          <NavItem label="DeFi" target={ViewState.DEFI} />
          <NavItem label="Staking" target={ViewState.STAKING} />
          <NavItem label="Bounties" target={ViewState.BOUNTIES} />
          <NavItem label="Architex Go" target={ViewState.ARCHITEX_GO} />
          
          <div className="w-px h-6 bg-white/20 mx-1 self-center hidden md:block"></div>
          <NavItem label="Stock" target={ViewState.INVENTORY} />
          <NavItem label="Calculator" target={ViewState.CALCULATOR} />
          
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

        <div className="flex items-center gap-3">
             {session?.isAuthenticated ? (
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
        {view === ViewState.ARCHITEX_GO && <ArchitexGo />}
        
        {(view === ViewState.ADMIN_LOGIN || view === ViewState.ADMIN_PANEL) && (
            <AdminPanel onLogout={() => {
                setAccessDenied(true); // Force back to gate on logout if blocked
                setView(ViewState.DASHBOARD);
                init(); // Re-init to check permissions
            }} />
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

      {/* AI Companion */}
      <ArchieBot currentView={view} />

      {/* Footer */}
      <footer className="mt-20 border-t border-white/5 pt-8 text-center text-gray-500 text-xs">
        <p>© 2024 Architex Protocol. Built on Pi Network.</p>
        <p className="mt-2 font-mono">v1.0.0-beta | Pi Testnet</p>
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