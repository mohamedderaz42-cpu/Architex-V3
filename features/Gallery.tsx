
import React, { useEffect, useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { dalGetPublicGallery } from '../services/dataAccessLayer';
import { DesignAsset } from '../types';
import { UI_CONSTANTS } from '../constants';

export const Gallery: React.FC = () => {
  const [items, setItems] = useState<DesignAsset[]>([]);
  const [filter, setFilter] = useState<'TRENDING' | 'NEW' | 'TOP'>('TRENDING');

  useEffect(() => {
    const fetchGallery = async () => {
      const data = await dalGetPublicGallery();
      setItems(data);
    };
    fetchGallery();
  }, []);

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-4xl font-display font-bold text-white mb-2">Public Gallery</h2>
          <p className="text-gray-400">Discover architectural masterpieces from the Pi Community.</p>
        </div>
        
        {/* Filters */}
        <div className="flex bg-white/5 p-1 rounded-lg backdrop-blur-sm border border-white/10">
          {['TRENDING', 'NEW', 'TOP'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
                filter === f 
                ? 'bg-neon-purple text-white shadow-lg shadow-neon-purple/20' 
                : 'text-gray-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((item) => (
          <GlassCard key={item.id} className="!p-0 group relative overflow-hidden h-80 cursor-pointer hover:border-neon-cyan/50 transition-colors">
            {/* Background Image */}
            <img 
              src={item.thumbnailUrl} 
              alt={item.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>

            {/* Content Content */}
            <div className="absolute inset-0 p-4 flex flex-col justify-end translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <div className="flex justify-between items-start mb-2">
                 <h3 className="text-lg font-bold text-white leading-tight">{item.title}</h3>
                 <div className="px-2 py-1 rounded bg-black/40 backdrop-blur border border-white/10 text-[10px] text-neon-cyan">
                    {item.format}
                 </div>
              </div>
              
              <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                <div className="flex items-center gap-2">
                    <img src={item.authorAvatar} alt={item.author} className="w-6 h-6 rounded-full border border-white/30" />
                    <span className="text-xs text-gray-300">{item.author}</span>
                </div>
                <div className="flex items-center gap-1 text-neon-pink text-xs font-bold">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                    {item.likes}
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};
