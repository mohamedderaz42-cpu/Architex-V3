import React, { useState, useEffect } from 'react';
import { ViewState, UserSession } from './types';
import { Dashboard } from './features/Dashboard';
import { Whitepaper } from './features/Whitepaper';
import { GlassCard } from './components/GlassCard';
import { ArchieBot } from './components/ArchieBot';
import { initializeSession, handleAddTrustline } from './services/orchestrator';
import { UI_CONSTANTS } from './constants';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const userSession = await initializeSession();
      setSession(userSession);
      setLoading(false);
    };
    init();
  }, []);

  const onAddTrustline = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const updatedSession = await handleAddTrustline(session);
      setSession(updatedSession);
    } catch (e) {
      alert("Failed to establish trustline.");
    } finally {
      setLoading(false);
    }
  };

  const NavItem = ({ label, target }: { label: string; target: ViewState }) => (
    <button
      onClick={() => setView(target)}
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
            <span className="font-display font-bold text-xl">A</span>
          </div>
          <span className="font-display font-bold text-2xl tracking-wide">ARCHITEX</span>
        </div>

        <nav className="flex gap-2 bg-white/5 p-1 rounded-xl backdrop-blur-md border border-white/10">
          <NavItem label="Dashboard" target={ViewState.DASHBOARD} />
          <NavItem label="Whitepaper" target={ViewState.WHITEPAPER} />
          <NavItem label="Wallet" target={ViewState.WALLET} />
        </nav>

        {/* User Status */}
        <div className="flex items-center gap-3">
             {loading ? (
                 <div className="h-2 w-20 bg-white/10 animate-pulse rounded"></div>
             ) : session?.isAuthenticated ? (
                 <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-green-500/30 bg-green-500/10">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-mono text-green-400">{session.username}</span>
                 </div>
             ) : (
                 <button className="text-sm text-neon-cyan">Connect Pi</button>
             )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="animate-[fadeIn_0.5s_ease-out]">
        {view === ViewState.DASHBOARD && <Dashboard />}
        {view === ViewState.WHITEPAPER && <Whitepaper />}
        
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
                     {session?.hasTrustline ? 'Active' : 'Pending Trustline'}
                   </div>
                </div>
              </div>

              {!session?.hasTrustline && (
                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg mb-6">
                  <p className="text-orange-200 text-sm mb-3">
                    Your wallet requires a Trustline to the ARTX Asset Contract to receive tokens.
                  </p>
                  <button 
                    onClick={onAddTrustline}
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 rounded font-bold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {loading ? 'Processing on Ledger...' : 'Establish Trustline (0.5 XLM Reserve)'}
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
          </div>
        )}
      </main>

      {/* AI Companion */}
      <ArchieBot />

      {/* Footer */}
      <footer className="mt-20 border-t border-white/5 pt-8 text-center text-gray-500 text-xs">
        <p>© 2024 Architex Protocol. Built on Pi Network & Stellar Soroban.</p>
        <p className="mt-2 font-mono">v1.0.0-alpha | Testnet</p>
      </footer>
    </div>
  );
};

export default App;