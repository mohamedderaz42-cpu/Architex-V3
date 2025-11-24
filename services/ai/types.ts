export interface AIImageInput {
  mimeType: string;
  data: string; // Base64 string
}

export interface AIChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface AIInput {
  prompt: string;
  images?: AIImageInput[];
  history?: AIChatMessage[];
  systemInstruction?: string;
  config?: {
    temperature?: number;
    maxTokens?: number;
  };
}

export interface AIOutput {
  text: string;
  raw?: any;
  providerId: string;
  modelUsed: string;
}

export interface IAIProvider {
  initialize(): void;
  generateContent(input: AIInput): Promise<AIOutput>;
}

export interface AIProviderConfig {
  id: string;
  name: string;
  apiEnvVar: string;
  models: {
    text: string;
    vision: string;
    image_generation?: string;
  };
}
