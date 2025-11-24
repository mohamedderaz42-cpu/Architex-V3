
import React, { useState, useEffect } from 'react';
import { ViewState, UserSession, SystemMode, Plugin } from './types';
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
import { PluginStore } from './features/PluginStore'; // Import
import { GlassCard } from './components/GlassCard';
import { ArchieBot } from './components/ArchieBot';
import { initializeSession, handleAddTrustline } from './services/orchestrator';
import { adsService } from './services/adsService';
import { dalGetCart, dalSignTerms, dalGetInstalledPlugins } from './services/dataAccessLayer';
import { systemConfigService } from './services/adminService'; 
import { legalService } from './services/legalService';
import { offlineService } from './services/offlineService';
import { UI_CONSTANTS } from './constants';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeContextId, setActiveContextId] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);
  
  // Phase 11: Beta Gate Logic
  const [appMode, setAppMode] = useState<SystemMode>('BETA'); 
  const [accessDenied, setAccessDenied] = useState(false);

  // Phase 12: Digital Immunity
  const [showToS, setShowToS] = useState(false);
  const [signingToS, setSigningToS] = useState(false);

  // Phase 11: Dynamic Dock
  const [installedPlugins, setInstalledPlugins] = useState<Plugin[]>([]);

  // Offline State
  const [isOffline, setIsOffline] = useState(!offlineService.isOnline());

  useEffect(() => {
    init();
    adsService.init();

    // Global Offline Listener
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const updateCartCount = async () => {
        const items = await dalGetCart();
        const count = items.reduce((acc, item) => acc + item.cartQuantity, 0);
        setCartCount(count);
    };
    const updatePlugins = async () => {
        const plugins = await dalGetInstalledPlugins();
        setInstalledPlugins(plugins);
    };

    updateCartCount();
    updatePlugins();
    
    const interval = setInterval(() => {
        updateCartCount();
        updatePlugins(); // Poll for new installs
    }, 2000);
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

    // Check Digital Immunity Signature
    if (userSession.isAuthenticated && !userSession.hasSignedToS) {
        setShowToS(true);
    }

    setLoading(false);
  };

  const handleSignToS = async () => {
      if (!session) return;
      setSigningToS(true);
      try {
          await dalSignTerms(session.walletAddress || 'mock_addr');
          setSession({...session, hasSignedToS: true});
          setShowToS(false);
      } catch (e) {
          alert("Failed to sign terms. Please try again.");
      } finally {
          setSigningToS(false);
      }
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

  // DIGITAL IMMUNITY PROTOCOL MODAL
  if (showToS) {
      // ... (Existing ToS Modal Logic - Omitted for Brevity, kept in actual render)
      return (
          <div className="min-h-screen flex items-center justify-center bg-black/90 backdrop-blur-lg p-4 relative z-50">
              <GlassCard className="max-w-2xl w-full max-h-[80vh] flex flex-col border-neon-cyan/50 shadow-[0_0_100px_rgba(0,243,255,0.2)]">
                  <div className="p-6 border-b border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                          <svg className="w-8 h-8 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                          <h2 className="text-2xl font-display font-bold text-white">Digital Immunity Protocol</h2>
                      </div>
                      <p className="text-gray-400 text-sm">
                          Action Required: You must cryptographically sign the "Venue Only" agreement to access the Architex Protocol.
                      </p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 bg-black/40 font-mono text-xs text-gray-300 leading-relaxed whitespace-pre-wrap border-y border-white/5">
                      {legalService.getDigitalImmunityTerms()}
                  </div>
                  <div className="p-6 bg-white/5 border-t border-white/10">
                      <button 
                          onClick={handleSignToS}
                          disabled={signingToS}
                          className="w-full py-4 bg-gradient-to-r from-neon-cyan to-blue-600 text-white font-bold rounded-lg shadow-lg hover:scale-[1.01] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                          {signingToS ? "Signing Transaction..." : "Sign with Pi Wallet"}
                      </button>
                  </div>
              </GlassCard>
          </div>
      );
  }

  // BETA GATE SCREEN
  if (accessDenied && view !== ViewState.ADMIN_LOGIN) {
      // ... (Existing Beta Gate Logic - Omitted for Brevity)
      return (
          <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
              <GlassCard className="max-w-lg w-full p-10 text-center border-neon-purple/50 relative z-10 shadow-[0_0_100px_rgba(124,58,237,0.2)]">
                  <h1 className="text-4xl font-display font-bold text-white mb-2">Closed Beta</h1>
                  <p className="text-gray-300 mb-8 leading-relaxed">Access Restricted.</p>
                  <button onClick={forceAdminLogin} className="text-xs text-gray-600 hover:text-gray-400 mt-4">Administrator Login</button>
              </GlassCard>
          </div>
      );
  }

  return (
    <div className="min-h-screen font-sans text-white p-4 pb-24 md:p-8 max-w-7xl mx-auto relative">
      {/* Global Offline Indicator */}
      {isOffline && (
          <div className="fixed top-0 left-0 right-0 bg-orange-600 text-black text-center text-xs font-bold py-1 z-[60] animate-pulse">
              ⚠️ NETWORK OFFLINE: Using Cached Data
          </div>
      )}

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
          <NavItem label="App Store" target={ViewState.PLUGIN_STORE} /> 
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
        {view === ViewState.PLUGIN_STORE && <PluginStore />}
        
        {(view === ViewState.ADMIN_LOGIN || view === ViewState.ADMIN_PANEL) && (
            <AdminPanel onLogout={() => {
                setAccessDenied(true); // Force back to gate on logout if blocked
                setView(ViewState.DASHBOARD);
                init(); // Re-init to check permissions
            }} />
        )}
        
        {/* ... Wallet view ... */}
      </main>

      {/* DYNAMIC PLUGIN DOCK (OS Layer) */}
      {installedPlugins.length > 0 && (
          <div className="fixed bottom-2 left-1/2 -translate-x-1/2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 flex gap-4 z-40 shadow-[0_0_30px_rgba(0,0,0,0.5)] animate-[slideUp_0.5s_ease-out]">
              {installedPlugins.map(plugin => (
                  <button 
                    key={plugin.id}
                    className="group relative flex flex-col items-center justify-center w-10 h-10 rounded hover:bg-white/10 transition-all hover:-translate-y-2"
                    onClick={() => alert(`Launching ${plugin.name}... (Simulated)`)}
                  >
                      <span className="text-xl grayscale group-hover:grayscale-0 transition-all">{plugin.iconUrl}</span>
                      <span className="absolute -top-8 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {plugin.name}
                      </span>
                  </button>
              ))}
          </div>
      )}

      {/* AI Companion */}
      <ArchieBot currentView={view} />

      {/* Footer */}
      <footer className="mt-20 border-t border-white/5 pt-8 text-center text-gray-500 text-xs">
        <p>© 2024 Architex Protocol. Built on Pi Network.</p>
        <p className="mt-2 font-mono">v1.0.0-beta | Pi Testnet</p>
      </footer>
    </div>
  );
};

export default App;
