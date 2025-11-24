
import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../components/GlassCard';
import { visionAdapter } from '../services/vision/VisionAdapter';
import { piService } from '../services/piService';
import { DesignAsset } from '../types';

interface ARViewerProps {
    design?: DesignAsset; // The "Digital Twin" to project
    onClose: () => void;
}

export const ARViewer: React.FC<ARViewerProps> = ({ design, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    
    // AR State
    const [isTracking, setIsTracking] = useState(false);
    const [scale, setScale] = useState(0.1); // Start small (Tabletop)
    const [rotation, setRotation] = useState(0);
    const [lighting, setLighting] = useState<'DAY' | 'NIGHT'>('DAY');
    const [isOnSite, setIsOnSite] = useState(false); // 1:1 Scale Mode
    const [features, setFeatures] = useState(0);

    // Simulated Plane Anchor
    const [anchor, setAnchor] = useState<{x:number, y:number, z:number} | null>(null);

    useEffect(() => {
        startCamera();
        const interval = setInterval(updateARLoop, 500);
        return () => {
            clearInterval(interval);
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (e) {
            console.error("AR Camera Error", e);
        }
    };

    const stopCamera = () => {
        const stream = videoRef.current?.srcObject as MediaStream;
        stream?.getTracks().forEach(t => t.stop());
    };

    const updateARLoop = async () => {
        // 1. Simulate SLAM Tracking
        const metrics = visionAdapter.getSLAMMetrics();
        setFeatures(metrics.trackedPoints);
        setIsTracking(metrics.trackingState === 'TRACKING');

        // 2. Auto-detect Plane (Mock)
        if (metrics.trackingState === 'TRACKING' && !anchor) {
            const plane = visionAdapter.trackPlane();
            if (plane.valid) setAnchor(plane);
        }

        // 3. Auto-detect Lighting (Step 8.1)
        // In a real implementation, we would grab a frame from videoRef
        const light = await visionAdapter.estimateEnvironmentalLighting({} as any);
        setLighting(light);
    };

    const handleToggleScale = () => {
        const newMode = !isOnSite;
        setIsOnSite(newMode);
        // Step 8.3: 1:1 Scale Logic
        // If On-Site, scale is 1.0 (Life size). If Tabletop, scale is 0.05 (Model size).
        setScale(newMode ? 1.0 : 0.05); 
    };

    const handleShare = () => {
        // Step 8.2: Social Share
        piService.shareToPiSocial(
            `Just projected the '${design?.title}' Digital Twin on-site using Architex AR! #PiNetwork #Web3`,
            design?.thumbnailUrl
        );
    };

    return (
        <div className="fixed inset-0 z-50 bg-black overflow-hidden">
            {/* Camera Feed */}
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="absolute inset-0 w-full h-full object-cover opacity-90"
            />

            {/* AR Overlay (The Digital Twin) */}
            {anchor && design && (
                <div 
                    className="absolute top-1/2 left-1/2 w-64 h-64 preserve-3d transition-all duration-700 ease-out"
                    style={{
                        transform: `
                            translate(-50%, -50%) 
                            perspective(1000px) 
                            rotateX(60deg) 
                            rotateZ(${rotation}deg) 
                            scale3d(${scale * 5}, ${scale * 5}, ${scale * 5})
                        `
                    }}
                >
                    {/* Building Wireframe Mockup */}
                    <div className={`w-full h-full border-4 ${isOnSite ? 'border-neon-cyan/80' : 'border-white/50'} bg-blue-500/10 backdrop-blur-sm relative shadow-[0_0_50px_rgba(0,243,255,0.3)]`}>
                        <div className="absolute inset-0 grid grid-cols-4 grid-rows-4">
                            {Array.from({length:16}).map((_,i) => <div key={i} className="border border-white/10"></div>)}
                        </div>
                        {/* Lighting Simulation Layer */}
                        <div className={`absolute inset-0 transition-colors duration-1000 ${lighting === 'NIGHT' ? 'bg-blue-900/60 mix-blend-multiply' : 'bg-yellow-100/10 mix-blend-overlay'}`}></div>
                        
                        {/* Labels */}
                        <div className="absolute -top-10 left-0 bg-black/60 px-2 py-1 rounded text-white text-[5px] whitespace-nowrap transform -rotate-x-0">
                            {design.title} (Digital Twin)
                        </div>
                    </div>
                </div>
            )}

            {/* HUD Layer */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
                {/* Top Bar */}
                <div className="flex justify-between items-start pointer-events-auto">
                    <button onClick={onClose} className="bg-black/60 backdrop-blur border border-white/20 rounded-full w-10 h-10 flex items-center justify-center text-white">
                        ✕
                    </button>
                    
                    <GlassCard className="!p-2 !bg-black/60 flex flex-col items-end">
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                            <span className="text-[10px] font-mono text-white">{isTracking ? 'SLAM LOCK' : 'SCANNING...'}</span>
                        </div>
                        <div className="text-[10px] text-neon-cyan mt-1">{features} Feature Points</div>
                    </GlassCard>
                </div>

                {/* Reticle (if not tracked) */}
                {!anchor && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                        <div className="w-20 h-20 border-2 border-white rounded-lg border-dashed animate-[spin_10s_linear_infinite]"></div>
                        <div className="text-center text-white text-xs mt-4 font-bold">Point at Ground</div>
                    </div>
                )}

                {/* Controls */}
                <div className="pointer-events-auto space-y-4">
                    {/* Time Slider (Step 8.1) */}
                    <div className="flex items-center gap-4 bg-black/60 p-3 rounded-xl border border-white/10">
                        <span className="text-xs text-gray-300">☀️</span>
                        <input 
                            type="range" 
                            min="0" max="1" step="1" 
                            value={lighting === 'DAY' ? 0 : 1}
                            onChange={(e) => setLighting(e.target.value === '0' ? 'DAY' : 'NIGHT')}
                            className="w-full accent-neon-cyan"
                        />
                        <span className="text-xs text-gray-300">🌙</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button 
                            onClick={handleToggleScale}
                            className={`flex-1 py-4 rounded-xl font-bold text-sm border transition-all ${
                                isOnSite 
                                ? 'bg-neon-purple/80 border-neon-purple text-white shadow-lg shadow-neon-purple/50' 
                                : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                            }`}
                        >
                            {isOnSite ? '📍 On-Site Mode (1:1)' : '📐 Tabletop Mode'}
                        </button>

                        <button 
                            onClick={handleShare}
                            className="flex-1 py-4 bg-gradient-to-r from-neon-cyan to-blue-600 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            Capture & Share
                        </button>
                    </div>
                    
                    {/* Rotate Control */}
                    <div className="bg-black/60 p-2 rounded-xl flex justify-center">
                        <input 
                            type="range" 
                            min="0" max="360" 
                            value={rotation}
                            onChange={(e) => setRotation(parseInt(e.target.value))}
                            className="w-full accent-white"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
