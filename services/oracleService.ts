
import { OracleQuote } from "../types";

/**
 * ARCHITEX INTERNAL ORACLE
 * 
 * A secure, cached service that provides the official reference price for ARTX.
 * In a production environment, this would aggregate data from the Stellar DEX
 * and potentially external Pi markets, verifying cryptographic signatures to ensure data integrity.
 */
class OracleService {
  private cache: Map<string, OracleQuote> = new Map();
  private CACHE_TTL = 30000; // 30 seconds validity

  /**
   * Get a trusted quote for a trading pair.
   * Logic: Checks cache -> Fetches from Aggregators -> Validates -> Returns
   */
  async getQuote(pair: string): Promise<OracleQuote> {
    const now = Date.now();
    const cached = this.cache.get(pair);

    if (cached && (now - cached.timestamp < this.CACHE_TTL)) {
      return cached;
    }

    return this.fetchFreshQuote(pair);
  }

  private async fetchFreshQuote(pair: string): Promise<OracleQuote> {
    // Simulate network latency for aggregation
    await new Promise(resolve => setTimeout(resolve, 400));

    // Simulation: Calculate rate based on a base price + random market noise
    const basePrice = 0.42; 
    const volatility = (Math.random() * 0.02) - 0.01; // +/- 0.01 fluctuation
    const finalRate = basePrice + volatility;

    const quote: OracleQuote = {
      pair,
      rate: parseFloat(finalRate.toFixed(4)),
      timestamp: Date.now(),
      source: Math.random() > 0.3 ? 'DEX_AGGREGATOR' : 'RESERVE_BANK',
      confidenceScore: 0.98, // High confidence
      signature: `sig_${Date.now()}_${Math.random().toString(36).substring(7)}` // Mock crypto signature
    };

    this.cache.set(pair, quote);
    return quote;
  }

  /**
   * EXTERNAL API ENDPOINT (Simulated)
   * This is the data product sold to developers.
   * Returns a comprehensive market snapshot suitable for external consumption.
   */
  async getMarketDataAPI(apiKey: string): Promise<any> {
    // Simulate Authentication & Rate Limiting Check
    await new Promise(resolve => setTimeout(resolve, 600));

    if (!apiKey.startsWith('sk_live_')) {
        throw new Error("Invalid or Missing API Key");
    }

    // Aggregate data for the API Response
    const artxPi = await this.getQuote('ARTX/Pi');
    // Simulate another pair for the index
    const artxUsdc = {
        rate: artxPi.rate * 45.0, // Mock conversion
        source: 'AGGREGATED'
    };

    return {
        status: 'success',
        timestamp: new Date().toISOString(),
        provider: 'Architex Price Index v1',
        license: 'Enterprise/Developer',
        indices: [
            {
                symbol: 'ARTX/Pi',
                price: artxPi.rate,
                volume_24h: 1250400,
                confidence: artxPi.confidenceScore,
                source: artxPi.source,
                signature: artxPi.signature
            },
            {
                symbol: 'ARTX/USDC',
                price: artxUsdc.rate,
                source: artxUsdc.source,
                derived: true
            }
        ],
        meta: {
            request_id: `req_${Math.random().toString(36).substr(2, 9)}`,
            quota_remaining: 9998,
            server_time_ms: 12
        }
    };
  }
}

export const oracleService = new OracleService();