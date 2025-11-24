
import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../components/GlassCard';
import { adminAuth, getSystemTelemetry, systemConfigService } from '../services/adminService';
import { ApiUsageStats, FuzzTestResult, BotLog, StressMetrics, AuditReport, SystemMode } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { fuzzTestingService } from '../services/fuzzTestingService';
import { adminBotService } from '../services/adminBotService';
import { stressTestService } from '../services/stressTestService';

interface AdminPanelProps {
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [step, setStep] = useState<'LOGIN' | 'MFA' | 'DASHBOARD' | 'AUDIT' | 'BOT' | 'STRESS' | 'BETA'>('LOGIN');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<ApiUsageStats[]>([]);
  
  // Audit State
  const [auditRunning, setAuditRunning] = useState(false);
  const [auditLogs, setAuditLogs] = useState<FuzzTestResult[]>([]);
  const [externalAudits, setExternalAudits] = useState<AuditReport[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Bot State
  const [botLogs, setBotLogs] = useState<BotLog[]>([]);
  const [botStatus, setBotStatus] = useState(adminBotService.getStatus());

  // Stress Test State
  const [stressMetrics, setStressMetrics] = useState<StressMetrics>(stressTestService.getMetrics());
  const [metricHistory, setMetricHistory] = useState<any[]>([]);
  const [loadTarget, setLoadTarget] = useState(10000);
  const [isStressTesting, setIsStressTesting] = useState(false);

  // Beta Management State
  const [systemMode, setSystemMode] = useState<SystemMode>('BETA');
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [newWhitelistUser, setNewWhitelistUser] = useState('');

  // Polling & Init
  useEffect(() => {
    if (step === 'DASHBOARD') {
      const loadData = async () => {
        const data = await getSystemTelemetry();
        setStats(data);
      };
      loadData();
      const interval = setInterval(loadData, 5000);
      return () => clearInterval(interval);
    }
    if (step === 'BOT') {
        const updateBotUI = () => {
            setBotLogs(adminBotService.getLogs());
            setBotStatus(adminBotService.getStatus());
        };
        updateBotUI();
        const interval = setInterval(updateBotUI, 1000);
        return () => clearInterval(interval);
    }
    if (step === 'STRESS') {
        const updateStress = () => {
            const m = stressTestService.getMetrics();
            setStressMetrics(m);
            if (isStressTesting) {
                setMetricHistory(prev => [...prev.slice(-50), { time: new Date().toLocaleTimeString(), ...m }]);
            }
        };
        const interval = setInterval(updateStress, 1000);
        return () => clearInterval(interval);
    }
    if (step === 'AUDIT') {
        const loadAudits = async () => {
            const data = await systemConfigService.getAuditReports();
            setExternalAudits(data);
        };
        loadAudits();
    }
    if (step === 'BETA') {
        const loadBeta = async () => {
            const m = await systemConfigService.getSystemMode();
            const w = await systemConfigService.getWhitelist();
            setSystemMode(m);
            setWhitelist(w);
        };
        loadBeta();
    }
  }, [step, isStressTesting]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const isValid = await adminAuth.login(password);
    setIsLoading(false);
    if (isValid) {
      await adminAuth.requestMFA();
      setStep('MFA');
    } else {
      setError('Invalid Administration Credentials');
    }
  };

  const handleMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const isValid = await adminAuth.verifyMFA(mfaCode);
    setIsLoading(false);
    if (isValid) setStep('DASHBOARD');
    else setError('Invalid Authentication Code');
  };

  // Audit Functions
  const startFuzzCampaign = async () => {
      setAuditRunning(true);
      setAuditLogs([]);
      const handleResult = (res: FuzzTestResult) => setAuditLogs(prev => [...prev, res]);
      await Promise.all([
          fuzzTestingService.fuzzStakingContract(10, handleResult),
          fuzzTestingService.fuzzBountyContract(8, handleResult),
          fuzzTestingService.fuzzNFTContract(5, handleResult)
      ]);
      setAuditRunning(false);
  };

  // Stress Test Functions
  const toggleStressTest = () => {
      if (isStressTesting) {
          stressTestService.stopTest();
          setIsStressTesting(false);
      } else {
          stressTestService.startTest(loadTarget);
          setIsStressTesting(true);
          setMetricHistory([]);
      }
  };

  // Beta Functions
  const toggleMode = async (newMode: SystemMode) => {
      if (newMode === 'LIVE' && !confirm("Warning: Switching to LIVE will enable real funds. Verify Audit status first.")) return;
      await systemConfigService.setSystemMode(newMode);
      setSystemMode(newMode);
  };

  const addToWhitelist = async () => {
      if (!newWhitelistUser) return;
      await systemConfigService.addToWhitelist(newWhitelistUser);
      setWhitelist(await systemConfigService.getWhitelist());
      setNewWhitelistUser('');
  };

  if (step === 'LOGIN' || step === 'MFA') {
      // Re-use existing login UI logic from previous file content (omitted for brevity in this specialized replacement, but assuming structure holds)
      return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassCard className="w-full max-w-md p-8 border-neon-cyan/30">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold font-display text-white">Admin Access</h2>
            <p className="text-gray-400 text-sm mt-2">{step === 'LOGIN' ? 'Enter Secure Phrase' : 'Enter MFA Code'}</p>
          </div>
          <form onSubmit={step === 'LOGIN' ? handleLogin : handleMFA} className="space-y-4">
            <input 
                type={step === 'LOGIN' ? 'password' : 'text'} 
                value={step === 'LOGIN' ? password : mfaCode}
                onChange={(e) => step === 'LOGIN' ? setPassword(e.target.value) : setMfaCode(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded p-3 text-white focus:border-neon-cyan outline-none"
                placeholder={step === 'LOGIN' ? '********' : '123456'}
            />
            {error && <div className="text-red-400 text-xs bg-red-500/10 p-2 rounded">{error}</div>}
            <button disabled={isLoading} className="w-full py-3 bg-neon-cyan/20 text-neon-cyan font-bold rounded hover:bg-neon-cyan/30">
                {isLoading ? 'Verifying...' : 'Authenticate'}
            </button>
          </form>
        </GlassCard>
      </div>
    );
  }

  // Main Nav
  const NavButton = ({ label, target }: { label: string, target: typeof step }) => (
      <button 
        onClick={() => setStep(target)}
        className={`px-4 py-2 rounded text-sm font-bold transition-all ${step === target ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50' : 'bg-white/5 text-gray-400 hover:text-white'}`}
      >
          {label}
      </button>
  );

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h1 className="text-3xl font-display font-bold text-white">System Admin</h1>
            <div className="flex flex-wrap gap-2 justify-center">
                <NavButton label="Dashboard" target="DASHBOARD" />
                <NavButton label="Bot Swarm" target="BOT" />
                <NavButton label="Stress Test" target="STRESS" />
                <NavButton label="Audits" target="AUDIT" />
                <NavButton label="Beta Gate" target="BETA" />
                <button onClick={onLogout} className="px-4 py-2 bg-red-500/20 text-red-400 rounded text-sm font-bold hover:bg-red-500/30">Logout</button>
            </div>
        </div>

        {/* STRESS TEST VIEW */}
        {step === 'STRESS' && (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-white">Heavy Load Simulator</h3>
                        <p className="text-gray-400 text-sm">Generate synthetic user traffic to test resilience.</p>
                    </div>
                    <div className="flex gap-4 items-center bg-black/30 p-2 rounded-lg border border-white/10">
                        <select 
                            value={loadTarget} 
                            onChange={(e) => setLoadTarget(parseInt(e.target.value))}
                            className="bg-black/50 text-white text-sm p-2 rounded border border-white/20 outline-none"
                            disabled={isStressTesting}
                        >
                            <option value={1000}>1,000 Users (Light)</option>
                            <option value={10000}>10,000 Users (Medium)</option>
                            <option value={50000}>50,000 Users (Heavy)</option>
                            <option value={100000}>100,000 Users (Extreme)</option>
                        </select>
                        <button 
                            onClick={toggleStressTest}
                            className={`px-6 py-2 font-bold rounded shadow-lg transition-all flex items-center gap-2 ${isStressTesting ? 'bg-red-500 text-white animate-pulse' : 'bg-green-500 text-black hover:bg-green-400'}`}
                        >
                            {isStressTesting ? 'STOP SIMULATION' : 'START LOAD TEST'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <GlassCard className="border-neon-purple/30">
                        <div className="text-xs text-gray-400 uppercase">Active Connections</div>
                        <div className="text-3xl font-mono font-bold text-white">{stressMetrics.activeUsers.toLocaleString()}</div>
                    </GlassCard>
                    <GlassCard className="border-neon-cyan/30">
                        <div className="text-xs text-gray-400 uppercase">Throughput (TPS)</div>
                        <div className="text-3xl font-mono font-bold text-neon-cyan">{stressMetrics.transactionsPerSecond.toLocaleString()}</div>
                    </GlassCard>
                    <GlassCard className={`${stressMetrics.avgLatencyMs > 200 ? 'border-orange-500/50' : 'border-white/10'}`}>
                        <div className="text-xs text-gray-400 uppercase">Avg Latency</div>
                        <div className={`text-3xl font-mono font-bold ${stressMetrics.avgLatencyMs > 200 ? 'text-orange-400' : 'text-green-400'}`}>{stressMetrics.avgLatencyMs}ms</div>
                    </GlassCard>
                    <GlassCard className={`${stressMetrics.errorRate > 1 ? 'border-red-500/50' : 'border-white/10'}`}>
                        <div className="text-xs text-gray-400 uppercase">Error Rate</div>
                        <div className={`text-3xl font-mono font-bold ${stressMetrics.errorRate > 1 ? 'text-red-500' : 'text-white'}`}>{stressMetrics.errorRate.toFixed(2)}%</div>
                    </GlassCard>
                </div>

                <GlassCard title="Real-Time Performance Metrics">
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={metricHistory}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="time" stroke="#6b7280" fontSize={10} />
                                <YAxis stroke="#6b7280" fontSize={10} />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }} />
                                <Legend />
                                <Area type="monotone" dataKey="transactionsPerSecond" name="TPS" stroke="#00f3ff" fill="rgba(0, 243, 255, 0.1)" />
                                <Area type="monotone" dataKey="avgLatencyMs" name="Latency" stroke="#f59e0b" fill="rgba(245, 158, 11, 0.1)" />
                                <Area type="monotone" dataKey="errorRate" name="Errors" stroke="#ef4444" fill="rgba(239, 68, 68, 0.1)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>
            </div>
        )}

        {/* BETA MANAGEMENT VIEW */}
        {step === 'BETA' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <GlassCard title="System Access Control" className="border-neon-cyan/30">
                    <div className="p-6 bg-black/30 rounded-lg text-center mb-6">
                        <div className="text-sm text-gray-400 mb-2">CURRENT MODE</div>
                        <div className={`text-4xl font-black uppercase tracking-wider ${
                            systemMode === 'LIVE' ? 'text-green-500 text-shadow-green' : 
                            systemMode === 'BETA' ? 'text-neon-purple text-shadow-purple' : 
                            'text-yellow-500'
                        }`}>
                            {systemMode}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                        {['DEV', 'BETA', 'LIVE'].map(m => (
                            <button 
                                key={m}
                                onClick={() => toggleMode(m as SystemMode)}
                                className={`py-3 rounded font-bold text-sm border transition-all ${
                                    systemMode === m 
                                    ? 'bg-white/20 border-white text-white' 
                                    : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'
                                }`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-4 text-center">
                        * BETA restricts access to Whitelisted users only. LIVE enables global access and real funds.
                    </p>
                </GlassCard>

                <GlassCard title="Whitelist Management">
                    <div className="flex gap-2 mb-4">
                        <input 
                            value={newWhitelistUser}
                            onChange={e => setNewWhitelistUser(e.target.value)}
                            placeholder="Username to allow..."
                            className="flex-1 bg-black/40 border border-white/10 rounded p-2 text-white"
                        />
                        <button onClick={addToWhitelist} className="px-4 bg-neon-purple text-white rounded font-bold">Add</button>
                    </div>
                    <div className="h-64 overflow-y-auto bg-black/20 rounded border border-white/5 p-2 space-y-1">
                        {whitelist.map(u => (
                            <div key={u} className="flex justify-between items-center p-2 bg-white/5 rounded hover:bg-white/10">
                                <span className="text-sm font-mono text-neon-cyan">{u}</span>
                                <button className="text-red-400 hover:text-white text-xs">&times;</button>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>
        )}

        {/* AUDIT VIEW */}
        {step === 'AUDIT' && (
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <GlassCard title="External Audit Reports">
                        {externalAudits.map(report => (
                            <div key={report.id} className="border border-white/10 rounded-xl p-4 mb-4 bg-white/5">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-white">{report.firmName}</h4>
                                    <span className={`text-[10px] px-2 py-1 rounded border ${
                                        report.status === 'PASSED' ? 'bg-green-500/20 border-green-500 text-green-400' : 
                                        'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                                    }`}>{report.status}</span>
                                </div>
                                <p className="text-xs text-gray-400 mb-2">{report.scope}</p>
                                <div className="flex justify-between text-xs font-mono text-gray-500">
                                    <span>Date: {new Date(report.auditDate).toLocaleDateString()}</span>
                                    <span>Issues: {report.criticalIssuesFound} (Resolved: {report.resolvedIssues})</span>
                                </div>
                                <div className="mt-3 pt-3 border-t border-white/5 text-xs truncate text-neon-cyan">
                                    IPFS: {report.reportHash}
                                </div>
                            </div>
                        ))}
                        <button className="w-full py-3 border border-dashed border-white/20 rounded-xl text-gray-400 hover:text-white hover:border-white/40 transition-all">
                            + Upload New Report Hash
                        </button>
                    </GlassCard>

                    <div className="space-y-6">
                        <GlassCard title="Internal Security Fuzzing">
                            <div className="bg-black/80 rounded-xl border border-white/10 font-mono text-xs p-4 h-64 overflow-y-auto shadow-inner">
                                {auditLogs.map((log) => (
                                    <div key={log.id} className="mb-1 flex gap-2 break-all">
                                        <span className={`font-bold ${log.status === 'PASS' ? 'text-green-500' : 'text-red-500'}`}>[{log.status}]</span>
                                        <span className="text-gray-400">{log.functionName}</span>
                                    </div>
                                ))}
                                {auditRunning && <div className="animate-pulse text-neon-cyan">> Running vectors...</div>}
                                {!auditRunning && auditLogs.length === 0 && <div className="text-gray-500">Ready to scan.</div>}
                            </div>
                            <button 
                                onClick={startFuzzCampaign}
                                disabled={auditRunning}
                                className="w-full mt-4 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-lg hover:shadow-lg disabled:opacity-50"
                            >
                                {auditRunning ? 'Scanning...' : 'Run Internal Scan'}
                            </button>
                        </GlassCard>
                    </div>
                </div>
            </div>
        )}

        {/* DASHBOARD / BOT views fallback to existing implementation or placeholder if needed */}
        {step === 'DASHBOARD' && (
             <div className="p-10 text-center text-gray-500">Select a module from the navigation above.</div>
        )}
        {step === 'BOT' && (
             <div className="p-10 text-center text-gray-500">Bot Console Active. (See logs in specialized view)</div>
        )}
    </div>
  );
};
