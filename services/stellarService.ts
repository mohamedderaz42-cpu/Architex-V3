import * as StellarSdkNamespace from "@stellar/stellar-sdk";
import { STELLAR_CONFIG } from "../constants";
import { ChainBalance, OrderBookData, OrderBookEntry } from "../types";

// Handle esm.sh CJS/ESM interop: check for .default property which contains the actual module exports
const Sdk: any = StellarSdkNamespace;
const StellarSdk = Sdk.default || Sdk;

// Initialize Server Connection securely
let server: any;
try {
    if (StellarSdk && StellarSdk.Horizon) {
        server = new StellarSdk.Horizon.Server(STELLAR_CONFIG.horizonUrl);
    } else {
        console.warn("Stellar SDK Horizon not available");
    }
} catch (e) {
    console.error("Failed to initialize Stellar Server", e);
}

// Helper to create SDK Asset objects
const getSdkAsset = (code: string, issuer?: string) => {
  if (!StellarSdk || !StellarSdk.Asset) return null;
  if (code === 'XLM' || !issuer) return StellarSdk.Asset.native();
  return new StellarSdk.Asset(code, issuer);
};

export const stellarService = {
  
  /**
   * Fetch Account Balances from Stellar Network
   * @param publicKey The Stellar Public Key to check
   */
  getChainBalances: async (publicKey: string): Promise<ChainBalance[]> => {
    if (!server) return [];
    try {
      const account = await server.loadAccount(publicKey);
      
      return account.balances.map((b: any) => ({
        assetCode: b.asset_type === 'native' ? 'XLM' : b.asset_code,
        balance: b.balance,
        issuer: b.asset_issuer
      }));
    } catch (e) {
      // console.warn("Stellar Account not found on Testnet, returning empty balances.", e);
      return [];
    }
  },

  /**
   * Fetch Order Book for a pair (e.g., ARTX/XLM or USDC/XLM)
   */
  getOrderBook: async (baseCode: string, counterCode: string): Promise<OrderBookData> => {
    if (!server || !StellarSdk) return { bids: [], asks: [], spread: '0%' };
    try {
      const buying = getSdkAsset(counterCode, STELLAR_CONFIG.assets.USDC.issuer); // Counter
      const selling = StellarSdk.Asset.native(); // Base (XLM)

      if (!buying || !selling) return { bids: [], asks: [], spread: '0%' };

      // Using XLM (Native) vs USDC (Testnet) for reliable demo data visualization
      const orderbook = await server.orderbook(buying, selling).call();

      const formatEntry = (entry: any): OrderBookEntry => ({
        price: parseFloat(entry.price).toFixed(4),
        amount: parseFloat(entry.amount).toFixed(2),
        total: parseFloat(entry.price) * parseFloat(entry.amount)
      });

      const bids = orderbook.bids.slice(0, 10).map(formatEntry);
      const asks = orderbook.asks.slice(0, 10).map(formatEntry);
      
      const bestBid = bids.length > 0 ? parseFloat(bids[0].price) : 0;
      const bestAsk = asks.length > 0 ? parseFloat(asks[0].price) : 0;
      const spread = bestAsk > 0 ? ((bestAsk - bestBid) / bestAsk * 100).toFixed(2) + '%' : '0%';

      return {
        bids,
        asks,
        spread
      };
    } catch (e) {
      console.error("Failed to fetch Orderbook", e);
      return { bids: [], asks: [], spread: '0%' };
    }
  },

  /**
   * Simulate reading Pi balance (since Pi Horizon is private/authenticated)
   * This represents the "Gateway" aspect.
   */
  getPiBalance: async (): Promise<string> => {
      // In a real Pi App, this comes from the UserSession or a backend proxy.
      // We simulate a network read here.
      await new Promise(r => setTimeout(r, 500));
      return "142.50";
  }
};