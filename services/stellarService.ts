import { ChainBalance, OrderBookData, OrderBookEntry } from "../types";

// NOTE: This service has been refactored to remove direct Stellar SDK dependencies.
// It now interfaces with the Pi Network SDK (via piService for payments) and provides
// simulated Chain/DEX data for the Architex Dashboard, as Pi Network currently does not
// expose a public OrderBook API for the frontend.

export const stellarService = {
  
  /**
   * Fetch Account Balances
   * Now returns Pi Network balances and Architex Token balances.
   */
  getChainBalances: async (publicKey: string): Promise<ChainBalance[]> => {
    // Simulate API delay
    await new Promise(r => setTimeout(r, 600));

    return [
      {
        assetCode: 'Pi',
        balance: '142.50',
        issuer: 'Pi Network'
      },
      {
        assetCode: 'ARTX',
        balance: '250.00',
        issuer: 'Architex Protocol'
      }
    ];
  },

  /**
   * Fetch Order Book for a pair (e.g., ARTX/Pi)
   * Simulates an Order Book since Pi does not have a native Horizon-like endpoint exposed to client.
   */
  getOrderBook: async (baseCode: string, counterCode: string): Promise<OrderBookData> => {
    await new Promise(r => setTimeout(r, 800));

    // Generate mock order book data for ARTX / Pi
    const generateOrders = (startPrice: number, count: number, isBid: boolean) => {
      return Array.from({ length: count }, (_, i) => {
        const price = isBid ? startPrice - (i * 0.01) : startPrice + (i * 0.01);
        const amount = (Math.random() * 100).toFixed(2);
        return {
          price: price.toFixed(4),
          amount: amount,
          total: price * parseFloat(amount)
        } as OrderBookEntry;
      });
    };

    const currentPrice = 0.42;
    const bids = generateOrders(currentPrice - 0.01, 8, true);
    const asks = generateOrders(currentPrice + 0.01, 8, false);

    const bestBid = parseFloat(bids[0].price);
    const bestAsk = parseFloat(asks[0].price);
    const spread = ((bestAsk - bestBid) / bestAsk * 100).toFixed(2) + '%';

    return {
      bids,
      asks,
      spread
    };
  },

  /**
   * Get Pi Balance
   */
  getPiBalance: async (): Promise<string> => {
      // In a real Pi App, this would verify the user's wallet via the Pi SDK scopes.
      await new Promise(r => setTimeout(r, 500));
      return "142.50";
  }
};
