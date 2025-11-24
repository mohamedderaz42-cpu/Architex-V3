import { AI_CONFIG } from '../../ai_provider_config';
import { GeminiProvider } from './GeminiProvider';
import { IAIProvider, AIInput, AIOutput, AIProviderConfig } from './types';

class AIAdapter {
  private provider: IAIProvider;
  
  constructor() {
    const activeProviderId = AI_CONFIG.activeProvider;
    // Cast to ensure we access the specific provider config safely
    const providerConfig = AI_CONFIG.providers[activeProviderId as keyof typeof AI_CONFIG.providers];

    if (!providerConfig) {
      throw new Error(`AI Provider configuration for ${activeProviderId} not found.`);
    }

    switch (activeProviderId) {
      case 'GEMINI':
        // We cast to AIProviderConfig to match the expected interface, as the static object is compatible
        this.provider = new GeminiProvider(providerConfig as AIProviderConfig);
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