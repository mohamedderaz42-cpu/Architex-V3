
import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { UI_CONSTANTS } from '../constants';

interface CalculatorInputs {
    area: number; // sq meters
    materialType: 'CONCRETE' | 'TIMBER' | 'STEEL' | 'RECYCLED_COMPOSITE';
    energySource: 'GRID' | 'SOLAR' | 'MIXED';
    efficiencyLevel: 'STANDARD' | 'PASSIVE_HOUSE';
}

export const CarbonCalculator: React.FC = () => {
    const [inputs, setInputs] = useState<CalculatorInputs>({
        area: 100,
        materialType: 'CONCRETE',
        energySource: 'GRID',
        efficiencyLevel: 'STANDARD'
    });

    const [results, setResults] = useState<{
        totalCO2: number; // kg
        savings: number; // kg saved vs baseline
        piCredits: number; // potential Pi value
    } | null>(null);

    // Baseline Assumptions (kg CO2 per sqm)
    const BASELINE_EMISSIONS_PER_SQM = 250; 

    const MATERIAL_FACTORS = {
        'CONCRETE': 1.2,
        'STEEL': 1.5,
        'TIMBER': 0.6,
        'RECYCLED_COMPOSITE': 0.4
    };

    const ENERGY_FACTORS = {
        'GRID': 1.0,
        'MIXED': 0.6,
        'SOLAR': 0.1
    };

    useEffect(() => {
        calculate();
    }, [inputs]);

    const calculate = () => {
        // 1. Base Emissions
        let footprint = inputs.area * BASELINE_EMISSIONS_PER_SQM;

        // 2. Apply Modifiers
        footprint *= MATERIAL_FACTORS[inputs.materialType];
        footprint *= ENERGY_FACTORS[inputs.energySource];
        
        if (inputs.efficiencyLevel === 'PASSIVE_HOUSE') {
            footprint *= 0.5;
        }

        const baseline = inputs.area * BASELINE_EMISSIONS_PER_SQM;
        const savings = Math.max(0, baseline - footprint);
        
        // Mock Exchange Rate: 100kg CO2 saved = 1 Pi Credit
        const credits = savings / 100;

        setResults({
            totalCO2: Math.round(footprint),
            savings: Math.round(savings),
            piCredits: parseFloat(credits.toFixed(2))
        });
    };

    return (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-display font-bold text-white">Carbon Footprint Calculator</h2>
                    <p className="text-gray-400">Estimate emissions and potential sustainability rewards.</p>
                </div>
                <div className="bg-green-500/10 border border-green-500/30 px-4 py-2 rounded-lg">
                    <span className="text-xs text-green-400 font-bold uppercase block">Exchange Rate</span>
                    <span className="text-white font-mono text-sm">100kg CO2 = 1.00 Pi Credit</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Inputs */}
                <GlassCard title="Project Parameters">
                    <div className="space-y-6">
                        <div>
                            <label className="flex justify-between text-xs text-gray-500 uppercase font-bold mb-2">
                                <span>Total Floor Area</span>
                                <span className="text-white">{inputs.area} m²</span>
                            </label>
                            <input 
                                type="range" min="10" max="1000" step="10"
                                value={inputs.area}
                                onChange={(e) => setInputs({...inputs, area: parseInt(e.target.value)})}
                                className="w-full accent-neon-cyan"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Primary Material</label>
                                <select 
                                    value={inputs.materialType}
                                    onChange={(e) => setInputs({...inputs, materialType: e.target.value as any})}
                                    className="w-full bg-black/40 border border-white/10 rounded p-3 text-white outline-none focus:border-green-500"
                                >
                                    <option value="CONCRETE">Concrete (Standard)</option>
                                    <option value="STEEL">Structural Steel</option>
                                    <option value="TIMBER">Mass Timber (Eco)</option>
                                    <option value="RECYCLED_COMPOSITE">Recycled Composite</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Energy Source</label>
                                <select 
                                    value={inputs.energySource}
                                    onChange={(e) => setInputs({...inputs, energySource: e.target.value as any})}
                                    className="w-full bg-black/40 border border-white/10 rounded p-3 text-white outline-none focus:border-green-500"
                                >
                                    <option value="GRID">Standard Grid</option>
                                    <option value="MIXED">Hybrid / Mixed</option>
                                    <option value="SOLAR">100% Renewable</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-gray-500 uppercase font-bold mb-2">Building Standard</label>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setInputs({...inputs, efficiencyLevel: 'STANDARD'})}
                                    className={`flex-1 py-3 border rounded-lg text-sm font-bold transition-all ${inputs.efficiencyLevel === 'STANDARD' ? 'bg-white/10 border-white text-white' : 'border-white/10 text-gray-500'}`}
                                >
                                    Standard Code
                                </button>
                                <button 
                                    onClick={() => setInputs({...inputs, efficiencyLevel: 'PASSIVE_HOUSE'})}
                                    className={`flex-1 py-3 border rounded-lg text-sm font-bold transition-all ${inputs.efficiencyLevel === 'PASSIVE_HOUSE' ? 'bg-green-500/20 border-green-500 text-green-400' : 'border-white/10 text-gray-500'}`}
                                >
                                    Passive House
                                </button>
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* Results */}
                <div className="space-y-6">
                    <GlassCard className="bg-gradient-to-br from-black to-green-900/20 border-green-500/30 h-full flex flex-col justify-center">
                        <div className="text-center">
                            <h3 className="text-gray-400 text-sm uppercase tracking-widest mb-2">Estimated Footprint</h3>
                            <div className="text-5xl font-display font-bold text-white mb-1">
                                {results?.totalCO2.toLocaleString()} <span className="text-lg text-gray-500">kg CO2</span>
                            </div>
                            <div className="h-1 w-32 mx-auto bg-gray-700 rounded-full mt-4 overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-1000 ${results?.savings && results.savings > 0 ? 'bg-green-500' : 'bg-red-500'}`} 
                                    style={{ width: '100%' }} // Simplified visual
                                ></div>
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-2 gap-4 text-center border-t border-white/10 pt-6">
                            <div>
                                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Carbon Saved</div>
                                <div className={`text-2xl font-bold ${results?.savings && results.savings > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                                    {results?.savings.toLocaleString()} kg
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Potential Credits</div>
                                <div className="text-2xl font-bold text-neon-cyan font-mono">
                                    {results?.piCredits} Pi
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                    
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 flex gap-3 items-start">
                        <div className="text-xl">💡</div>
                        <p>
                            Switching to <strong>Recycled Composite</strong> with <strong>Solar</strong> power could save over 2,000 kg of CO2 for this project size, earning you roughly ~20 Pi in carbon credits.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
