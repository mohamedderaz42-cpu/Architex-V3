import React from 'react';
import { GlassCard } from './GlassCard';

interface ProactiveInterventionProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ProactiveIntervention: React.FC<ProactiveInterventionProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
      <GlassCard className="max-w-md w-full !border-neon-purple/50 shadow-[0_0_50px_rgba(124,58,237,0.3)] transform transition-all scale-100">
        <div className="relative">
            {/* AI Pulse Effect */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-20 h-20 bg-neon-purple/20 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-12 h-12 bg-black border border-neon-purple rounded-full flex items-center justify-center z-10 shadow-lg shadow-neon-purple/50">
                 <svg className="w-6 h-6 text-neon-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>

            <div className="mt-6 text-center">
                <h3 className="text-xl font-display font-bold text-white mb-1">Workflow Optimization</h3>
                <p className="text-xs text-neon-purple font-mono uppercase tracking-widest mb-4">Proactive UX Engine • Rule #1</p>
                
                <div className="p-4 bg-white/5 rounded-lg border border-white/10 mb-6 text-left">
                    <p className="text-gray-300 text-sm leading-relaxed">
                        We've detected multiple manual iterations on this project. <span className="text-white font-bold">Would you like to hire a professional designer to complete this work?</span>
                    </p>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-transparent border border-white/20 text-gray-400 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors"
                    >
                        Continue Manually
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="flex-1 py-3 px-4 bg-gradient-to-r from-neon-purple to-pink-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-neon-purple/25 hover:shadow-neon-purple/40 transition-all flex items-center justify-center gap-2"
                    >
                        <span>Hire Professional</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </button>
                </div>
            </div>
        </div>
      </GlassCard>
    </div>
  );
};