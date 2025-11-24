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

  // Helper to simulate SLAM point cloud data retrieval for the UI
  getSLAMMetrics() {
    return {
      trackedPoints: simulatedFeaturePoints,
      trackingState: simulatedFeaturePoints > 20 ? 'TRACKING' : 'SEARCHING'
    };
  }
}

export const visionAdapter = new VisionAdapter();