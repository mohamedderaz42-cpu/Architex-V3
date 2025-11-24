import React from 'react';
import { UI_CONSTANTS } from '../constants';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  glow?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', title, glow = false, onClick }) => {
  const glowClass = glow ? 'shadow-[0_0_20px_rgba(0,243,255,0.15)] border-neon-cyan/30' : 'border-white/10';
  
  return (
    <div 
      onClick={onClick}
      className={`${UI_CONSTANTS.glassClass} p-6 ${glowClass} ${className} relative overflow-hidden group transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
    >
      {glow && (
         <div className="absolute -top-10 -right-10 w-24 h-24 bg-neon-cyan/20 blur-3xl rounded-full group-hover:bg-neon-cyan/30 transition-colors"></div>
      )}
      {title && (
        <h3 className="text-xl font-display font-bold mb-4 tracking-wider text-white border-b border-white/5 pb-2">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};