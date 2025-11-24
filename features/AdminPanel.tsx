import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { adminAuth, getSystemTelemetry } from '../services/adminService';
import { ApiUsageStats, ViewState } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { UI_CONSTANTS } from '../constants';

interface AdminPanelProps {
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [step, setStep] = useState<'LOGIN' | 'MFA' | 'DASHBOARD'>('LOGIN');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<ApiUsageStats[]>([]);

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

  // Dashboard View
  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-display font-bold text-white">System Administration</h1>
            <p className="text-gray-400 text-sm font-mono mt-1">SECURE CONNECTION ESTABLISHED</p>
        </div>
        <button 
            onClick={onLogout}
            className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded hover:bg-red-500/30 transition-colors text-sm"
        >
            Terminate Session
        </button>
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