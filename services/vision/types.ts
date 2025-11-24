export interface ScanFrame {
  timestamp: number;
  imageData: string; // Base64
  width: number;
  height: number;
}

export interface ScanAnalysisResult {
  isValid: boolean;
  qualityScore: number; // 0.0 to 1.0
  instruction: string; // "Move closer", "Hold still", etc.
  featuresDetected: string[];
}

export interface ISLAMProvider {
  initialize(): Promise<void>;
  getPose(): Promise<{ position: { x: number; y: number; z: number }; rotation: any } | null>;
  trackFeatures(frame: ScanFrame): Promise<number>; // Returns number of tracked points
}

export interface IVisionAdapter {
  analyzeFrame(frame: ScanFrame): Promise<ScanAnalysisResult>;
}