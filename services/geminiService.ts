import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

// In a real scenario, we check if key exists.
const API_KEY = process.env.API_KEY || 'MISSING_KEY';

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: API_KEY });
  }
  return aiInstance;
};

export const generateArchieResponse = async (
  history: ChatMessage[],
  currentInput: string
): Promise<string> => {
  try {
    const ai = getAI();
    
    // Construct prompt context
    const systemInstruction = `
      You are ArchieBot, the AI Companion for Architex, a Web3 DApp on the Pi Network.
      Your tone is futuristic, helpful, and concise.
      You assist users with navigating the app, understanding Tokenomics (ARTX token), and Wallet operations.
      Strictly adhere to the following facts:
      - ARTX is the native token.
      - Total Supply: 100M.
      - Network: Stellar Soroban via Pi Network.
      - You are state-aware of the user's journey.
    `;

    // Simple context assembly for the prompt (stateless model call for simplicity/robustness)
    const conversation = history.map(m => `${m.role}: ${m.text}`).join('\n');
    const fullPrompt = `${conversation}\nuser: ${currentInput}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text || "I'm having trouble connecting to the neural net. Please try again.";
  } catch (error) {
    console.error("ArchieBot Error:", error);
    return "Protocol Malfunction: Unable to process request at this time.";
  }
};