
import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../components/GlassCard';
import { adminAuth, getSystemTelemetry } from '../services/adminService';
import { ApiUsageStats, ViewState, FuzzTestResult, BotLog } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { UI_CONSTANTS } from '../constants';
import { fuzzTestingService } from '../services/fuzzTestingService';
import { adminBotService } from '../services/adminBotService';

interface AdminPanelProps {
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [step, setStep] = useState<'LOGIN' | 'MFA' | 'DASHBOARD' | 'AUDIT' | 'BOT'>('LOGIN');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<ApiUsageStats[]>([]);
  
  // Audit State
  const [auditRunning, setAuditRunning] = useState(false);
  const [auditLogs, setAuditLogs] = useState<FuzzTestResult[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Bot State
  const [botLogs, setBotLogs] = useState<BotLog[]>([]);
  const [botStatus, setBotStatus] = useState(adminBotService.getStatus());
  const botLogsEndRef = useRef<HTMLDivElement>(null);

  // Telemetry Polling
  useEffect(() => {
    if (step === 'DASHBOARD') {
      const loadData = async () => {
        const data = await getSystemTelemetry();
        setStats(data);
      };
      loadData();
      const interval = setInterval(loadData, 5000); // Live update every 5s
      return () => clearInterval(interval);
    }
  }, [step]);

  // Bot Polling
  useEffect(() => {
      if (step === 'BOT') {
          const updateBotUI = () => {
              setBotLogs(adminBotService.getLogs());
              setBotStatus(adminBotService.getStatus());
          };
          updateBotUI();
          const interval = setInterval(updateBotUI, 1000);
          return () => clearInterval(interval);
      }
  }, [step]);

  // Auto-scroll logs
  useEffect(() => {
      if (step === 'AUDIT') {
          logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
  }, [auditLogs, step]);

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

    if (isValid) {
      setStep('DASHBOARD');
    } else {
      setError('Invalid Authentication Code');
    }
  };

  const startFuzzCampaign = async () => {
      setAuditRunning(true);
      setAuditLogs([]);
      
      const handleResult = (res: FuzzTestResult) => {
          setAuditLogs(prev => [...prev, res]);
      };

      // Run parallel campaigns
      await Promise.all([
          fuzzTestingService.fuzzStakingContract(10, handleResult),
          fuzzTestingService.fuzzBountyContract(8, handleResult),
          fuzzTestingService.fuzzNFTContract(5, handleResult)
      ]);

      setAuditRunning(false);
  };

  const toggleBot = () => {
      if (botStatus.isRunning) {
          adminBotService.stop();
      } else {
          adminBotService.start();
      }
      setBotStatus(adminBotService.getStatus());
  };

  if (step === 'LOGIN') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassCard className="w-full max-w-md p-8 border-red-500/30">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/50">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h2 className="text-2xl font-bold font-display text-white">Admin Access</h2>
            <p className="text-gray-400 text-sm mt-2">Restricted Area. Authorized Personnel Only.</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 uppercase font-bold">Secure Phrase</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1 bg-black/40 border border-white/10 rounded p-3 text-white focus:border-red-500 focus:outline-none transition-colors"
                placeholder="Enter password..."
              />
            </div>
            {error && <div className="text-red-400 text-xs bg-red-500/10 p-2 rounded border border-red-500/20">{error}</div>}
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3 bg-red-600/20 border border-red-600/50 hover:bg-red-600/40 text-red-100 rounded font-bold transition-all disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Authenticate'}
            </button>
          </form>
        </GlassCard>
      </div>
    );
  }

  if (step === 'MFA') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassCard className="w-full max-w-md p-8 border-neon-cyan/30">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-neon-cyan/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-neon-cyan/50">
                <svg className="w-8 h-8 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M12 14h.01M12 10h.01M12 6h.01M16 12a4 4 0 11-8 0 4 4 0 018 0zm-8 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <h2 className="text-2xl font-bold font-display text-white">Two-Factor Auth</h2>
            <p className="text-gray-400 text-sm mt-2">A verification code has been sent to your registered device.</p>
          </div>
          
          <form onSubmit={handleMFA} className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 uppercase font-bold">6-Digit Code</label>
              <input 
                type="text" 
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                maxLength={6}
                className="w-full mt-1 bg-black/40 border border-white/10 rounded p-3 text-white text-center text-2xl tracking-[0.5em] font-mono focus:border-neon-cyan focus:outline-none transition-colors"
              />
            </div>
            {error && <div className="text-red-400 text-xs bg-red-500/10 p-2 rounded border border-red-500/20">{error}</div>}
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3 bg-neon-cyan/20 border border-neon-cyan/50 hover:bg-neon-cyan/40 text-neon-cyan rounded font-bold transition-all disabled:opacity-50"
            >
              {isLoading ? 'Checking...' : 'Verify Identity'}
            </button>
          </form>
        </GlassCard>
      </div>
    );
  }

  // --- BOT VIEW ---
  if (step === 'BOT') {
      return (
          <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
             <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white">Automated Treasury Bot</h1>
                    <p className="text-gray-400 text-sm font-mono mt-1">
                        STATUS: {botStatus.isRunning ? <span className="text-green-400 animate-pulse">ONLINE - EXECUTING</span> : <span className="text-red-400">OFFLINE - STANDBY</span>}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setStep('DASHBOARD')} className="px-4 py-2 border border-white/10 rounded hover:bg-white/5 text-gray-300">
                        Back to Dashboard
                    </button>
                    <button 
                        onClick={toggleBot}
                        className={`px-6 py-2 font-bold rounded shadow-lg transition-all flex items-center gap-2 ${
                            botStatus.isRunning 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30' 
                            : 'bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        {botStatus.isRunning ? 'Stop Operation' : 'Initialize Bot'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Status Cards */}
                 <div className="space-y-4">
                     <GlassCard title="Treasury Monitor" className="border-neon-cyan/30">
                        <div className="text-2xl font-mono font-bold text-white mb-1">
                            {botStatus.treasury.toLocaleString()} <span className="text-sm text-gray-500">ARTX</span>
                        </div>
                        <div className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded inline-block">
                             ▲ Fees Incoming (Simulated)
                        </div>
                     </GlassCard>

                     <GlassCard title="Liquidity Health" className="border-neon-purple/30">
                        <div className="text-2xl font-mono font-bold text-white mb-1">
                            {botStatus.liquidity.toLocaleString()} <span className="text-sm text-gray-500">ARTX</span>
                        </div>
                        <div className="w-full bg-gray-800 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className="bg-neon-purple h-full animate-[pulse_3s_infinite]" style={{ width: '98%' }}></div>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1 text-right">Pool Sync: 98%</div>
                     </GlassCard>

                     <GlassCard title="Active Directives">
                        <ul className="text-xs space-y-2 text-gray-400">
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                Route Service Fees -> MultiSig
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                Auto-Rebalance AMM Pools
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                Sweep Dust to Treasury
                            </li>
                        </ul>
                     </GlassCard>
                 </div>

                 {/* Console Output */}
                 <div className="lg:col-span-2 bg-black rounded-xl border border-white/20 p-4 font-mono text-xs h-[500px] overflow-hidden flex flex-col shadow-2xl relative">
                    <div className="absolute top-0 left-0 right-0 bg-white/5 p-2 border-b border-white/10 text-gray-500 flex justify-between">
                         <span>root@architex-bot:~# tail -f /var/log/treasury.log</span>
                         <span className="flex gap-1">
                             <span className="w-3 h-3 rounded-full bg-red-500/20"></span>
                             <span className="w-3 h-3 rounded-full bg-yellow-500/20"></span>
                             <span className="w-3 h-3 rounded-full bg-green-500/20"></span>
                         </span>
                    </div>
                    <div className="mt-8 flex-1 overflow-y-auto space-y-1">
                        {botLogs.length === 0 && <div className="text-gray-600 italic">Waiting for bot initialization...</div>}
                        {botLogs.map(log => (
                            <div key={log.id} className="flex gap-2 break-all hover:bg-white/5 px-2 py-0.5 rounded">
                                <span className="text-gray-600 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                <span className={`font-bold shrink-0 w-20 ${
                                    log.status === 'SUCCESS' ? 'text-green-500' :
                                    log.status === 'WARNING' ? 'text-yellow-500' : 'text-red-500'
                                }`}>[{log.status}]</span>
                                <span className="text-neon-cyan shrink-0 w-24">{log.action}:</span>
                                <span className="text-gray-300">{log.details}</span>
                            </div>
                        ))}
                    </div>
                 </div>
            </div>
          </div>
      );
  }

  if (step === 'AUDIT') {
      const vulnCount = auditLogs.filter(l => l.status === 'VULNERABILITY').length;
      const passCount = auditLogs.filter(l => l.status === 'PASS').length;
      const failCount = auditLogs.filter(l => l.status === 'FAIL').length;
      const total = auditLogs.length;

      const pieData = [
          { name: 'Passed', value: passCount },
          { name: 'Failed', value: failCount },
          { name: 'Vuln', value: vulnCount }
      ];
      const COLORS = ['#22c55e', '#ef4444', '#f59e0b'];

      return (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white">Smart Contract Audit</h1>
                    <p className="text-gray-400 text-sm font-mono mt-1">AUTOMATED FUZZ TESTING ENGINE</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setStep('DASHBOARD')} className="px-4 py-2 border border-white/10 rounded hover:bg-white/5 text-gray-300">
                        Back to Dashboard
                    </button>
                    <button 
                        onClick={startFuzzCampaign}
                        disabled={auditRunning}
                        className="px-6 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                    >
                        {auditRunning ? <span className="animate-spin">⚙️</span> : '⚡'}
                        {auditRunning ? 'Fuzzing...' : 'Start Campaign'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stats */}
                <GlassCard title="Campaign Coverage" className="flex items-center justify-center flex-col">
                    {total > 0 ? (
                        <>
                            <div className="h-40 w-full">
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie data={pieData} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                                            {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex gap-4 text-xs mt-4">
                                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full"></div>PASS: {passCount}</div>
                                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-full"></div>ERR: {failCount}</div>
                                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-orange-500 rounded-full"></div>VULN: {vulnCount}</div>
                            </div>
                        </>
                    ) : (
                        <div className="text-gray-500 text-sm italic py-10">No audit data available</div>
                    )}
                </GlassCard>

                {/* Terminal */}
                <div className="lg:col-span-2 bg-black/80 rounded-xl border border-white/10 font-mono text-xs p-4 h-96 overflow-y-auto shadow-inner">
                    <div className="text-gray-500 mb-2 border-b border-gray-800 pb-2 sticky top-0 bg-black/80">
                        > ./architex-security-cli --fuzz-all --threads=4
                    </div>
                    {auditLogs.map((log) => (
                        <div key={log.id} className="mb-1 flex gap-2 break-all">
                            <span className="text-gray-600">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                            <span className={`font-bold w-16 ${
                                log.status === 'PASS' ? 'text-green-500' : 
                                log.status === 'FAIL' ? 'text-red-500' : 'text-orange-500'
                            }`}>
                                [{log.status}]
                            </span>
                            <span className="text-neon-cyan">{log.targetContract}::{log.functionName}</span>
                            <span className="text-gray-400">INPUT: {log.inputVector}</span>
                            <span className="text-gray-500"> -> {log.details}</span>
                        </div>
                    ))}
                    {auditRunning && <div className="animate-pulse text-neon-cyan mt-2">> Executing Randomized Vectors...</div>}
                    <div ref={logsEndRef} />
                </div>
            </div>
        </div>
      );
  }

  // Dashboard View
  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-display font-bold text-white">System Administration</h1>
            <p className="text-gray-400 text-sm font-mono mt-1">SECURE CONNECTION ESTABLISHED</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setStep('BOT')}
                className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded hover:bg-green-500/30 transition-colors text-sm font-bold flex items-center gap-2"
            >
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Auto-Admin Bot
            </button>
            <button 
                onClick={() => setStep('AUDIT')}
                className="px-4 py-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded hover:bg-orange-500/30 transition-colors text-sm font-bold"
            >
                Security Audit
            </button>
            <button 
                onClick={onLogout}
                className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded hover:bg-red-500/30 transition-colors text-sm"
            >
                Terminate Session
            </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map(stat => (
            <GlassCard key={stat.providerId} className="relative overflow-hidden">
                <div className={`absolute top-0 right-0 p-2 text-[10px] font-bold ${stat.status === 'ONLINE' ? 'bg-green-500 text-black' : 'bg-orange-500 text-black'}`}>
                    {stat.status}
                </div>
                <div className="text-gray-400 text-xs uppercase mb-1">{stat.providerName}</div>
                <div className="text-2xl font-bold font-mono">{stat.totalRequests.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Total Requests (24h)</div>
                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between text-xs">
                    <span className="text-gray-400">Avg Latency</span>
                    <span className={`${stat.avgLatency > 500 ? 'text-orange-400' : 'text-green-400'}`}>{stat.avgLatency}ms</span>
                </div>
            </GlassCard>
        ))}
         <GlassCard className="border-neon-purple/30">
            <div className="text-gray-400 text-xs uppercase mb-1">Total System Cost</div>
            <div className="text-2xl font-bold font-mono text-neon-purple">
                ${stats.reduce((acc, curr) => acc + curr.costEstimate, 0).toFixed(4)}
            </div>
            <div className="text-xs text-gray-500">Estimated (24h)</div>
            <div className="mt-4 pt-4 border-t border-white/5 text-xs text-gray-400">
                Usage trending normal
            </div>
        </GlassCard>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard title="Request Volume (Requests/Hour)">
             <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats[0]?.history || []}>
                         <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                         <XAxis dataKey="time" stroke="#6b7280" fontSize={10} />
                         <YAxis stroke="#6b7280" fontSize={10} />
                         <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                         />
                         <Legend />
                         <Line type="monotone" dataKey="requests" stroke="#00f3ff" strokeWidth={2} dot={false} name="Gemini" />
                    </LineChart>
                </ResponsiveContainer>
             </div>
        </GlassCard>

        <GlassCard title="Token Consumption Distribution">
            <div className="h-64 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="providerName" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" fontSize={10} />
                        <Tooltip 
                             cursor={{fill: 'rgba(255,255,255,0.05)'}}
                             contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        />
                        <Bar dataKey="totalTokens" fill="#7928ca" name="Total Tokens" radius={[4, 4, 0, 0]} />
                    </BarChart>
                 </ResponsiveContainer>
            </div>
        </GlassCard>
      </div>

      {/* Logs Table */}
      <GlassCard title="Live Provider Status">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead>
                    <tr className="border-b border-white/10 text-gray-400 font-mono text-xs uppercase">
                        <th className="py-3 px-4">Provider ID</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Error Rate</th>
                        <th className="py-3 px-4">Uptime</th>
                        <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="text-gray-300">
                    {stats.map(stat => (
                        <tr key={stat.providerId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-3 px-4 font-bold">{stat.providerName}</td>
                            <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold ${stat.status === 'ONLINE' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                    {stat.status}
                                </span>
                            </td>
                            <td className="py-3 px-4 font-mono">{stat.errorRate.toFixed(2)}%</td>
                            <td className="py-3 px-4 font-mono">99.98%</td>
                            <td className="py-3 px-4 text-right">
                                <button className="text-xs text-neon-cyan hover:underline">Configure</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
      </GlassCard>
    </div>
  );
};
