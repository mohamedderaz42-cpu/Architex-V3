import React from 'react';
import { GlassCard } from '../components/GlassCard';
import { TOKENOMICS, CONFIG } from '../constants';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export const Whitepaper: React.FC = () => {
  const data = Object.entries(TOKENOMICS.distributions).map(([key, value]) => ({
    name: key.replace(/([A-Z])/g, ' $1').trim(),
    value: value
  }));

  const COLORS = ['#00f3ff', '#bc13fe', '#7928ca', '#ff0080', '#ffffff'];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-display font-bold">Protocol Manifesto</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard title="Tokenomics Distribution">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
            {data.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-gray-300">{item.name}</span>
                </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard title="Vesting Schedule (Immutable)">
          <div className="space-y-4">
            {Object.entries(TOKENOMICS.vestingRules).map(([key, rule], idx) => (
                <div key={key} className="p-3 bg-white/5 rounded border border-white/5">
                    <div className="text-xs text-neon-cyan uppercase font-bold mb-1">{key}</div>
                    <div className="text-sm text-gray-300 font-mono">{rule}</div>
                </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard title="Contract Addresses (Soroban)">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-mono text-gray-400">
                <thead>
                    <tr className="border-b border-white/10">
                        <th className="py-2">Contract Name</th>
                        <th className="py-2">Address</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(CONFIG.contracts).map(([name, address]) => (
                        <tr key={name} className="border-b border-white/5">
                            <td className="py-2 capitalize text-white">{name}</td>
                            <td className="py-2 text-neon-purple">{address}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </GlassCard>
    </div>
  );
};