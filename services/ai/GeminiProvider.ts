import { GoogleGenAI } from "@google/genai";
import { IAIProvider, AIInput, AIOutput, AIProviderConfig } from "./types";

// Registry map to safely access env vars dynamically based on config strings
const ENV_REGISTRY: Record<string, string | undefined> = {
  "API_KEY": process.env.API_KEY,
  "OPENAI_API_KEY": process.env.OPENAI_API_KEY // Placeholder for future extensibility
};

export class GeminiProvider implements IAIProvider {
  private ai: GoogleGenAI | null = null;
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  initialize() {
    const apiKey = ENV_REGISTRY[this.config.apiEnvVar];
    if (!apiKey) {
      console.warn(`[GeminiProvider] Missing API Key for ${this.config.apiEnvVar}`);
      return;
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateContent(input: AIInput): Promise<AIOutput> {
    if (!this.ai) {
      this.initialize();
      if (!this.ai) throw new Error("AI Provider failed to initialize: Missing API Key");
    }

    // Select model: Use vision model if images are present, otherwise text model
    // Note: Gemini 2.5 Flash handles both, but we stick to config for flexibility
    const modelName = (input.images && input.images.length > 0) 
      ? this.config.models.vision 
      : this.config.models.text;

    try {
      // Prepare contents
      let parts: any[] = [];
      
      // Add images if present
      if (input.images) {
        input.images.forEach(img => {
          parts.push({
            inlineData: {
              mimeType: img.mimeType,
              data: img.data
            }
          });
        });
      }

      // Add text prompt
      parts.push({ text: input.prompt });

      // If history exists, we might need a chat session, but for generic stateless request:
      // We prepend history to the prompt or use 'contents' array if supported by simple generateContent
      // For simplicity in this generic stateless wrapper, we will format history as context in the prompt
      // or construct a multi-turn content payload if the specific provider logic allows.
      // Gemini 2.5 supports multi-turn in generateContent via `contents` array of messages.
      
      let contents: any = { parts };

      if (input.history && input.history.length > 0) {
        // Convert history to Gemini Content format
        // Current simplistic approach: Append history as text context for statelessness or proper chat structure
        // Let's use the chat structure for better results
        const historyContents = input.history.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.text }]
        }));
        // Append current turn
        contents = [...historyContents, { role: 'user', parts }];
      }

      const response = await this.ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
          systemInstruction: input.systemInstruction,
          temperature: input.config?.temperature,
        }
      });

      return {
        text: response.text || "",
        raw: response,
        providerId: this.config.id,
        modelUsed: modelName
      };

    } catch (error) {
      console.error("Gemini Provider Error:", error);
      throw error;
    }
  }
}
