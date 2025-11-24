
import React, { useEffect, useRef, useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { visionAdapter } from '../services/vision/VisionAdapter';
import { dalGenerateBlueprint } from '../services/dataAccessLayer';
import { VISION_CONFIG, UI_CONSTANTS } from '../constants';
import { ScanAnalysisResult } from '../services/vision/types';

interface ScannerProps {
    onNavigateToBlueprints: () => void;
}

export const Scanner: React.FC<ScannerProps> = ({ onNavigateToBlueprints }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [guidance, setGuidance] = useState<string>("Initializing Sensors...");
  const [quality, setQuality] = useState<number>(0);
  const [slamState, setSlamState] = useState<string>("INITIALIZING");
  const [features, setFeatures] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Speech Synthesis Helper
  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    // Cancel previous utterances to ensure real-time feedback
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    // Select a futuristic voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'));
    if (preferredVoice) utterance.voice = preferredVoice;
    window.speechSynthesis.speak(utterance);
  };

  // Camera Setup
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsScanning(true);
        speak("Scanner online. Point at structure.");
      } catch (err) {
        setGuidance("Camera Access Denied or Unavailable.");
        console.error("Camera Error:", err);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  // Guided Scanning Loop
  useEffect(() => {
    if (!isScanning || isGenerating) return;

    const intervalId = setInterval(async () => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (ctx && video.readyState === 4) {
          canvas.width = video.videoWidth / 4; // Downscale for performance
          canvas.height = video.videoHeight / 4;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = canvas.toDataURL('image/jpeg', 0.6);
          const base64Data = imageData.split(',')[1];

          // Call Vision Adapter
          const result: ScanAnalysisResult = await visionAdapter.analyzeFrame({
            imageData: base64Data,
            timestamp: Date.now(),
            width: canvas.width,
            height: canvas.height
          });

          // Update State
          setGuidance(result.instruction);
          setQuality(result.qualityScore);
          setFeatures(result.featuresDetected);

          // Audio Feedback (Only if instruction changes or is critical)
          if (result.instruction && Math.random() > 0.7) { // Reduce chattiness
             speak(result.instruction);
          }

          // Update Simulated SLAM State
          const metrics = visionAdapter.getSLAMMetrics();
          setSlamState(metrics.trackingState);
        }
      }
    }, VISION_CONFIG.scanIntervalMs);

    return () => clearInterval(intervalId);
  }, [isScanning, isGenerating]);

  const handleGenerate = async () => {
      if (quality < 0.3) {
          alert("Scan quality too low. Please stabilize.");
          return;
      }
      setIsScanning(false);
      setIsGenerating(true);
      speak("Processing scan data. Generating structural blueprint.");
      
      try {
          await dalGenerateBlueprint({ features });
          setIsGenerating(false);
          onNavigateToBlueprints();
      } catch (e) {
          setIsScanning(true);
          setIsGenerating(false);
          alert("Generation Failed.");
      }
  };

  return (
    <div className="relative h-[80vh] w-full rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Live Video Feed */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        className="w-full h-full object-cover opacity-80"
      />

      {/* HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
        
        {/* Top HUD */}
        <div className="flex justify-between items-start">
            <GlassCard className="!p-3 !bg-black/40 backdrop-blur-md">
                <div className="text-xs text-neon-cyan mb-1">SYSTEM STATUS</div>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${slamState === 'TRACKING' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="font-mono font-bold">{slamState}</span>
                </div>
            </GlassCard>

            <GlassCard className="!p-3 !bg-black/40 backdrop-blur-md text-right">
                <div className="text-xs text-neon-cyan mb-1">SCAN QUALITY</div>
                <div className="text-xl font-display font-bold text-white">{(quality * 100).toFixed(0)}%</div>
            </GlassCard>
        </div>

        {/* Reticle / SLAM Visualization */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white/20 rounded-lg flex items-center justify-center">
            <div className="absolute w-full h-[1px] bg-neon-cyan/50 top-1/2"></div>
            <div className="absolute h-full w-[1px] bg-neon-cyan/50 left-1/2"></div>
            <div className={`w-48 h-48 border-2 rounded ${quality > 0.7 ? 'border-green-500' : 'border-red-500/50'} transition-colors duration-500`}></div>
            {/* Simulated Feature Points */}
            <div className="absolute top-10 left-10 w-1 h-1 bg-yellow-400 rounded-full animate-ping"></div>
            <div className="absolute bottom-10 right-20 w-1 h-1 bg-yellow-400 rounded-full animate-ping delay-100"></div>
            <div className="absolute top-20 right-10 w-1 h-1 bg-yellow-400 rounded-full animate-ping delay-200"></div>
        </div>

        {/* Bottom HUD - Guidance */}
        <div className="space-y-4">
            {features.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center">
                    {features.map((f, i) => (
                        <span key={i} className="px-2 py-1 bg-neon-purple/20 border border-neon-purple/50 rounded text-xs text-neon-cyan">
                            {f}
                        </span>
                    ))}
                </div>
            )}
            
            <div className="flex items-end justify-between gap-4 pointer-events-auto">
                 <GlassCard className="!bg-black/60 backdrop-blur-xl border-neon-cyan/30 flex-1">
                    <div className="text-center">
                        <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">AI Guidance</p>
                        <p className="text-xl md:text-2xl font-display font-bold text-white animate-pulse">
                            "{guidance}"
                        </p>
                    </div>
                </GlassCard>

                {/* Generate Button */}
                <button 
                    onClick={handleGenerate}
                    disabled={isGenerating || quality < 0.3}
                    className="h-full px-6 py-4 bg-gradient-to-t from-neon-purple to-indigo-600 rounded-xl font-bold text-white shadow-[0_0_20px_rgba(124,58,237,0.5)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                    {isGenerating ? (
                        <span className="animate-pulse">PROCESSING...</span>
                    ) : (
                        <div className="flex flex-col items-center">
                            <span className="text-2xl">⚡</span>
                            <span className="text-xs mt-1">GENERATE</span>
                        </div>
                    )}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
