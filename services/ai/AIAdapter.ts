import config from '../../ai_provider_config.json';
import { GeminiProvider } from './GeminiProvider';
import { IAIProvider, AIInput, AIOutput } from './types';

class AIAdapter {
  private provider: IAIProvider;
  
  constructor() {
    const activeProviderId = config.activeProvider;
    // @ts-ignore - JSON import typing
    const providerConfig = config.providers[activeProviderId];

    if (!providerConfig) {
      throw new Error(`AI Provider configuration for ${activeProviderId} not found.`);
    }

    switch (activeProviderId) {
      case 'GEMINI':
        this.provider = new GeminiProvider(providerConfig);
        break;
      // Future: case 'OPENAI': ...
      default:
        throw new Error(`Provider ${activeProviderId} not implemented.`);
    }

    this.provider.initialize();
  }

  async generate(input: AIInput): Promise<AIOutput> {
    return this.provider.generateContent(input);
  }
}

export const aiAdapter = new AIAdapter();
