


import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { dalGetServiceProviders, dalGetArbitrators } from '../services/dataAccessLayer';
import { ServiceProviderProfile, ArbitratorProfile } from '../types';

export const ServiceNetwork: React.FC = () => {
    const [view, setView] = useState<'PROVIDERS' | 'ARBITRATORS'>('PROVIDERS');
    const [providers, setProviders] = useState<ServiceProviderProfile[]>([]);
    const [arbitrators, setArbitrators] = useState<ArbitratorProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const [p, a] = await Promise.all([dalGetServiceProviders(), dalGetArbitrators()]);
            setProviders(p);
            setArbitrators(a);
            setLoading(false);
        };
        loadData();
    }, []);

    return (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-display font-bold text-white">Service Network</h2>
                    <p className="text-gray-400">Verified Professionals and Dispute Resolution.</p>
                </div>
                <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                    <button 
                        onClick={() => setView('PROVIDERS')}
                        className={`px-4 py-2 rounded text-sm font-bold transition-all ${view === 'PROVIDERS' ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-gray-400 hover:text-white'}`}
                    >
                        Professionals
                    </button>
                    <button 
                        onClick={() => setView('ARBITRATORS')}
                        className={`px-4 py-2 rounded text-sm font-bold transition-all ${view === 'ARBITRATORS' ? 'bg-red-500/20 text-red-400' : 'text-gray-400 hover:text-white'}`}
                    >
                        Arbitrators
                    </button>
                </div>
            </div>

            {view === 'PROVIDERS' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {providers.map(prov => (
                        <GlassCard key={prov.id} className="relative group border-white/10 hover:border-neon-cyan/50 transition-all">
                            <div className="flex items-start gap-4 mb-4">
                                <img src={prov.avatarUrl} alt={prov.displayName} className="w-12 h-12 rounded-full border border-white/20" />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-white">{prov.displayName}</h3>
                                        {prov.verifiedId && (
                                            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                        )}
                                    </div>
                                    <p className="text-xs text-neon-cyan font-mono uppercase">{prov.role}</p>
                                    
                                    {/* Soulbound Token Badges */}
                                    {prov.soulboundTokens && prov.soulboundTokens.length > 0 && (
                                        <div className="flex gap-1 mt-1">
                                            {prov.soulboundTokens.map(sbt => (
                                                <span key={sbt.id} className="cursor-help" title={sbt.name + ': ' + sbt.criteria}>
                                                    {sbt.icon}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="mb-4">
                                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Certifications</div>
                                <div className="flex flex-wrap gap-2">
                                    {prov.certifications.map((cert, i) => (
                                        <span key={i} className="text-[10px] bg-white/5 border border-white/10 px-2 py-1 rounded text-gray-300" title={`Issued by ${cert.issuer}`}>
                                            {cert.name}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                <div className="text-sm">
                                    <span className="font-bold text-white">{prov.hourlyRate} Pi</span> / hr
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-yellow-500 font-bold">
                                        ★ {prov.reputationScore}/100
                                    </div>
                                    <div className="text-[10px] text-gray-500">{prov.jobsCompleted} Jobs</div>
                                </div>
                            </div>
                            
                            <button className="w-full mt-4 py-2 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan rounded hover:bg-neon-cyan/20 transition-colors font-bold text-sm">
                                Hire Provider
                            </button>
                        </GlassCard>
                    ))}
                </div>
            )}

            {view === 'ARBITRATORS' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {arbitrators.map(arb => (
                        <GlassCard key={arb.id} className="relative group border-red-500/20 hover:border-red-500/50 transition-all">
                             <div className="flex items-start gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/30 text-red-500">
                                    ⚖️
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">{arb.displayName}</h3>
                                    <p className="text-xs text-red-400 font-mono uppercase">{arb.specialty} Specialist</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-4 text-center">
                                <div className="bg-white/5 rounded p-2">
                                    <div className="text-lg font-bold text-white">{arb.casesSolved}</div>
                                    <div className="text-[10px] text-gray-500 uppercase">Cases Solved</div>
                                </div>
                                <div className="bg-white/5 rounded p-2">
                                    <div className="text-lg font-bold text-white">{arb.reputationScore}</div>
                                    <div className="text-[10px] text-gray-500 uppercase">Reputation</div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                <div className="text-sm text-gray-400">
                                    Standard Fee: <span className="text-white font-bold">{arb.feePerCase} Pi</span>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    );
};