
import React, { useEffect, useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { stellarService } from '../services/stellarService';
import { oracleService } from '../services/oracleService';
import { ChainBalance, OrderBookData, OracleQuote } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const DeFiDashboard: React.FC = () => {
  const [balances, setBalances] = useState<ChainBalance[]>([]);
  const [piBalance, setPiBalance] = useState<string>('0.00');
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Oracle & Calculator State
  const [oracleRate, setOracleRate] = useState<OracleQuote | null>(null);
  const [swapInput, setSwapInput] = useState('');
  const [swapOutput, setSwapOutput] = useState('');
  
  // Mock User Address
  const DEMO_PUBLIC_KEY = 'PI_USER_WALLET_ADDRESS_EXAMPLE'; 

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // 1. Fetch Balances & Orderbook
      const [stellarBal, piBal, obData, rateData] = await Promise.all([
        stellarService.getChainBalances(DEMO_PUBLIC_KEY),
        stellarService.getPiBalance(),
        stellarService.getOrderBook('ARTX', 'Pi'),
        oracleService.getQuote('ARTX/Pi')
      ]);

      setBalances(stellarBal);
      setPiBalance(piBal);
      setOrderBook(obData);
      setOracleRate(rateData);
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  // Calculator Logic
  const handleSwapInputChange = (val: string) => {
    setSwapInput(val);
    if (!oracleRate || !val) {
        setSwapOutput('');
        return;
    }
    const amount = parseFloat(val);
    if (!isNaN(amount)) {
        // Pi -> ARTX (Divide by rate because rate is Price of 1 ARTX in Pi)
        // Rate ~0.42 Pi per ARTX. So 1 Pi = 2.38 ARTX.
        const output = amount / oracleRate.rate;
        setSwapOutput(output.toFixed(4));
    }
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-3xl font-display font-bold text-white">DeFi Gateway</h2>
           <p className="text-gray-400 text-sm">Pi Network Bridge & Token Exchange</p>
        </div>
        <div className="flex gap-2">
            <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Pi Mainnet
            </span>
        </div>
      </div>

      {/* Balances Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="border-neon-purple/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="text-6xl font-bold">π</span>
            </div>
            <h3 className="text-gray-400 text-xs font-bold uppercase mb-2">Wallet Assets</h3>
            <div className="space-y-2">
                {loading ? <div className="animate-pulse h-8 bg-white/10 rounded"></div> : balances.map((b, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-white/5 pb-1 last:border-0">
                        <span className="font-bold text-white">{b.assetCode}</span>
                        <span className="font-mono text-neon-cyan">{parseFloat(b.balance).toFixed(2)}</span>
                    </div>
                ))}
            </div>
        </GlassCard>

        <GlassCard className="border-orange-500/30 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <svg className="w-20 h-20 text-orange-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
            </div>
            <h3 className="text-gray-400 text-xs font-bold uppercase mb-2">Pi Balance</h3>
             <div className="flex flex-col justify-center h-full pb-6">
                <div className="text-4xl font-display font-bold text-white">
                    {loading ? "..." : piBalance} <span className="text-lg text-orange-500">π</span>
                </div>
                <div className="text-xs text-orange-300/50 mt-1">Available for Transactions</div>
             </div>
        </GlassCard>

        {/* Oracle Powered Swap */}
        <GlassCard className="relative">
            <div className="flex justify-between items-center mb-4">
                 <h3 className="text-gray-400 text-xs font-bold uppercase">Quick Swap (DEX)</h3>
                 {oracleRate && (
                     <div className="flex items-center gap-1 text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20" title="Price verified by Internal Oracle">
                         <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                         Oracle Verified
                     </div>
                 )}
            </div>
            
            <div className="space-y-3">
                <div className="flex items-center gap-2 bg-black/30 p-2 rounded border border-white/10 focus-within:border-orange-500/50 transition-colors">
                    <input 
                        type="number" 
                        value={swapInput}
                        onChange={(e) => handleSwapInputChange(e.target.value)}
                        placeholder="0.00" 
                        className="bg-transparent w-full outline-none text-white text-right font-mono" 
                    />
                    <span className="text-sm font-bold text-orange-500 w-12 text-center">Pi</span>
                </div>
                
                <div className="flex justify-between items-center text-xs text-gray-500 px-1">
                    <span>Rate: 1 ARTX = {oracleRate?.rate.toFixed(4)} Pi</span>
                    <span className="transform rotate-90 md:rotate-0">↓</span>
                </div>

                <div className="flex items-center gap-2 bg-black/30 p-2 rounded border border-white/10">
                    <input 
                        type="number" 
                        value={swapOutput}
                        readOnly 
                        placeholder="0.00" 
                        className="bg-transparent w-full outline-none text-neon-purple text-right font-mono font-bold" 
                    />
                    <span className="text-sm font-bold text-neon-purple w-12 text-center">ARTX</span>
                </div>
                
                <button 
                    disabled={!swapInput || parseFloat(swapInput) <= 0}
                    className="w-full py-2 bg-white/5 hover:bg-neon-purple/20 border border-white/10 hover:border-neon-purple/50 rounded text-sm transition-all text-white font-bold disabled:opacity-50"
                >
                    Swap Assets
                </button>
            </div>
        </GlassCard>
      </div>

      {/* Order Book Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-96">
        <GlassCard title="Live Order Book (Pi/ARTX)" className="flex flex-col">
            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex justify-between text-[10px] text-gray-500 uppercase mb-2 px-2">
                    <span>Size (ARTX)</span>
                    <span>Price (Pi)</span>
                    <span>Total (Pi)</span>
                </div>
                
                {/* Asks (Sells) - Red */}
                <div className="flex-1 flex flex-col-reverse justify-end overflow-hidden mb-1 relative">
                    {orderBook?.asks.map((ask, i) => (
                        <div key={i} className="flex justify-between text-xs py-0.5 px-2 relative z-10 hover:bg-white/5">
                            <span className="text-gray-400">{ask.amount}</span>
                            <span className="text-neon-red font-mono">{ask.price}</span>
                            <span className="text-gray-400">{(parseFloat(ask.amount) * parseFloat(ask.price)).toFixed(2)}</span>
                            {/* Depth Visual */}
                            <div className="absolute top-0 right-0 h-full bg-neon-red/10 z-[-1]" style={{ width: `${Math.random() * 100}%` }}></div>
                        </div>
                    ))}
                    {orderBook?.asks.length === 0 && <div className="text-center text-gray-600 text-xs py-4">No Asks</div>}
                </div>

                {/* Spread */}
                <div className="py-2 border-y border-white/5 text-center text-sm font-mono text-gray-300 bg-white/5">
                    Spread: <span className="text-neon-cyan">{orderBook?.spread || '0.00%'}</span>
                </div>

                {/* Bids (Buys) - Green */}
                <div className="flex-1 overflow-hidden mt-1 relative">
                    {orderBook?.bids.map((bid, i) => (
                        <div key={i} className="flex justify-between text-xs py-0.5 px-2 relative z-10 hover:bg-white/5">
                            <span className="text-gray-400">{bid.amount}</span>
                            <span className="text-neon-green font-mono">{bid.price}</span>
                            <span className="text-gray-400">{(parseFloat(bid.amount) * parseFloat(bid.price)).toFixed(2)}</span>
                            {/* Depth Visual */}
                            <div className="absolute top-0 right-0 h-full bg-neon-green/10 z-[-1]" style={{ width: `${Math.random() * 100}%` }}></div>
                        </div>
                    ))}
                     {orderBook?.bids.length === 0 && <div className="text-center text-gray-600 text-xs py-4">No Bids</div>}
                </div>
            </div>
        </GlassCard>

        <GlassCard title="Price Action (24h)" className="flex flex-col">
             <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                        {name: '00:00', val: 0.38}, {name: '04:00', val: 0.39}, 
                        {name: '08:00', val: 0.41}, {name: '12:00', val: 0.42},
                        {name: '16:00', val: 0.40}, {name: '20:00', val: 0.41},
                        {name: '23:59', val: 0.42}
                    ]}>
                        <XAxis dataKey="name" hide />
                        <YAxis hide domain={['dataMin - 0.05', 'dataMax + 0.05']} />
                        <Tooltip 
                             cursor={{fill: 'rgba(255,255,255,0.05)'}}
                             contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        />
                        <Bar dataKey="val" fill="#00f3ff" radius={[2, 2, 0, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
                <div className="text-center text-xs text-gray-500 mt-2">Volume Analysis (Pi)</div>
             </div>
             <div className="mt-4 grid grid-cols-2 gap-4">
                 <div className="p-3 bg-white/5 rounded border border-white/5">
                     <div className="text-xs text-gray-400">24h High</div>
                     <div className="text-lg font-bold text-white">0.43 Pi</div>
                 </div>
                 <div className="p-3 bg-white/5 rounded border border-white/5">
                     <div className="text-xs text-gray-400">24h Low</div>
                     <div className="text-lg font-bold text-white">0.38 Pi</div>
                 </div>
             </div>
        </GlassCard>
      </div>
    </div>
  );
};
