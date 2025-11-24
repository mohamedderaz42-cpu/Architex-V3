
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
}

export const oracleService = new OracleService();
