import React from 'react';
import { GlassCard } from '../components/GlassCard';
import { UI_CONSTANTS, TOKENOMICS } from '../constants';

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">
              <span className={UI_CONSTANTS.textGradient}>Architex</span>
            </h1>
            <p className="text-gray-400 text-lg mb-6">High-Performance Web3 Ecosystem on Pi Network.</p>
            <div className="flex gap-4">
               <button className="px-6 py-3 bg-gradient-to-r from-neon-purple to-pink-600 rounded-lg font-bold text-white shadow-lg hover:shadow-neon-pink/20 transition-all">
                 Launch App
               </button>
               <button className="px-6 py-3 border border-white/20 rounded-lg font-bold text-white hover:bg-white/5 transition-all">
                 Learn More
               </button>
            </div>
        </div>
        
        {/* Stat Cards */}
        <div className="flex-1 grid grid-cols-2 gap-4">
             <GlassCard title="Total Supply" className="text-center">
                 <div className="text-2xl font-bold text-white">{TOKENOMICS.maxSupply.toLocaleString()}</div>
                 <div className="text-xs text-neon-cyan">ARTX</div>
             </GlassCard>
             <GlassCard title="Treasury" className="text-center">
                 <div className="text-2xl font-bold text-white">{TOKENOMICS.distributions.rewardsTreasury.toLocaleString()}</div>
                 <div className="text-xs text-neon-pink">Locked</div>
             </GlassCard>
        </div>
      </div>

      {/* Protocol Visuals */}
      <GlassCard title="Network Activity" glow>
        <div className="h-48 flex items-end justify-between gap-2 px-4">
           {[40, 65, 30, 80, 55, 90, 45, 70].map((h, i) => (
             <div key={i} className="w-full bg-gradient-to-t from-neon-purple/50 to-neon-cyan/50 rounded-t-sm transition-all duration-1000" style={{ height: `${h}%` }}></div>
           ))}
        </div>
        <div className="mt-4 flex justify-between text-xs text-gray-500 font-mono">
            <span>STARTUP</span>
            <span>INITIALIZATION</span>
            <span>SCALING</span>
        </div>
      </GlassCard>
    </div>
  );
};