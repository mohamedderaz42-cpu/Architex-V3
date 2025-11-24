
import { aiAdapter } from '../ai/AIAdapter';
import { ScanAnalysisResult, ScanFrame, IVisionAdapter } from './types';
import { VISION_CONFIG } from '../../constants';

// Internal Mock SLAM State
let simulatedFeaturePoints = 0;

class VisionAdapter implements IVisionAdapter {
  
  // This function acts as the bridge between raw camera frames and AI Intelligence
  async analyzeFrame(frame: ScanFrame): Promise<ScanAnalysisResult> {
    try {
      // We assume the AI Adapter is the "Brain" processing the vision stream
      // Requesting a JSON response for structured guidance
      const prompt = `
        You are the Vision Engine for Architex. Analyze this frame from a 3D scanner.
        Return ONLY a JSON object with this structure:
        {
          "isValid": boolean, (is the image clear and usable?)
          "qualityScore": number, (0.0 to 1.0)
          "instruction": "string", (short, spoken command to user, e.g., "Move Closer", "Too dark", "Scan complete")
          "featuresDetected": ["string", "string"] (list of architectural elements seen)
        }
        Strict JSON. No markdown.
      `;

      const response = await aiAdapter.generate({
        prompt: prompt,
        images: [{
          mimeType: 'image/jpeg',
          data: frame.imageData
        }],
        config: {
          temperature: 0.2, // Low temp for deterministic logic
          maxTokens: 150
        }
      });

      // Parse AI response (Robust handling for potential markdown wrapping)
      const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const result: ScanAnalysisResult = JSON.parse(cleanText);

      // Simulate SLAM Feature tracking boost based on AI recognition
      simulatedFeaturePoints = result.isValid ? Math.min(100, simulatedFeaturePoints + 10) : Math.max(0, simulatedFeaturePoints - 5);

      return result;
    } catch (error) {
      console.warn("Vision Analysis Failed, using fallback", error);
      return {
        isValid: false,
        qualityScore: 0.1,
        instruction: "Realigning sensors...",
        featuresDetected: []
      };
    }
  }

  // New Method: Verify Proof-of-Physical-Installation
  async verifyRealization(imageBase64: string): Promise<{ verified: boolean; confidence: number; comment: string }> {
    try {
        const prompt = `
            Analyze this image. Does it appear to be a completed, physical architectural structure, construction project, or manufactured object in the real world?
            Distinguish between a digital render and a real photograph.
            Return ONLY a JSON object with this structure:
            {
                "isRealized": boolean, (true if it looks like a real physical object/building)
                "confidence": number, (0.0 to 1.0)
                "comment": "string" (short verification reason, e.g. "Realistic lighting and natural environment detected.")
            }
            Strict JSON. No markdown.
        `;

        const response = await aiAdapter.generate({
            prompt: prompt,
            images: [{
                mimeType: 'image/jpeg',
                data: imageBase64
            }],
            config: {
                temperature: 0.1, // Very precise
                maxTokens: 150
            }
        });

        const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(cleanText);

        return {
            verified: result.isRealized,
            confidence: result.confidence,
            comment: result.comment
        };

    } catch (error) {
        console.error("Verification Logic Error", error);
        return {
            verified: false,
            confidence: 0,
            comment: "AI Analysis failed to process image."
        };
    }
  }

  // Helper to simulate SLAM point cloud data retrieval for the UI
  getSLAMMetrics() {
    return {
      trackedPoints: simulatedFeaturePoints,
      trackingState: simulatedFeaturePoints > 20 ? 'TRACKING' : 'SEARCHING'
    };
  }

  // AR: Estimate Lighting for Day/Night Cycle (Phase 8.1)
  // Returns 'DAY' or 'NIGHT' based on mock brightness analysis
  async estimateEnvironmentalLighting(frame: ScanFrame): Promise<'DAY' | 'NIGHT'> {
      // In a real app, we would calculate pixel luminance
      // Here we check the hour or random chance for simulation
      const hour = new Date().getHours();
      const isDay = hour > 6 && hour < 18;
      return isDay ? 'DAY' : 'NIGHT';
  }

  // AR: Plane Tracking simulation (Phase 8.3)
  // Returns mock 3D coordinates for placing the model
  trackPlane(): { x: number, y: number, z: number, valid: boolean } {
      // Simulate finding a plane after some feature points are found
      if (simulatedFeaturePoints > 30) {
          return { x: 0, y: -1.5, z: -5, valid: true };
      }
      return { x: 0, y: 0, z: 0, valid: false };
  }
}

export const visionAdapter = new VisionAdapter();
