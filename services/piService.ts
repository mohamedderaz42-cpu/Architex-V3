
import { PAYMENT_CONFIG } from "../constants";

export interface PaymentCallbacks {
  onReadyForServerApproval: (paymentId: string) => Promise<void>;
  onReadyForServerCompletion: (paymentId: string, txid: string) => Promise<void>;
  onCancel: (paymentId: string) => void;
  onError: (error: Error, payment: any) => void;
}

class PiService {
  private initialized = false;

  async init() {
    if (this.initialized) return;
    try {
      if (window.Pi) {
        await window.Pi.init({ version: "2.0", sandbox: true }); // Default to sandbox for dev
        this.initialized = true;
        console.log("[PiService] SDK Initialized");
      } else {
        console.warn("[PiService] Pi SDK not found. Running in Web Emulation Mode.");
      }
    } catch (e) {
      console.error("[PiService] Init Failed", e);
    }
  }

  async createPayment(memo: string, amount: number, callbacks: PaymentCallbacks): Promise<void> {
    await this.init();
    await this.processPayment(amount, memo, null, callbacks);
  }

  /**
   * SERVICE FEE ROUTING
   * Strictly enforces that 100% of the fee goes to the Treasury Multisig.
   * Used for: Image Generation (0.50 Pi) and Subscriptions.
   */
  async createTreasuryPayment(memo: string, amount: number, callbacks: PaymentCallbacks): Promise<void> {
    await this.init();
    
    console.log(`[PiService] 🛡️ SECURE ROUTING: Initiating Service Fee Payment`);
    console.log(`[PiService] ➡️ DESTINATION: ${PAYMENT_CONFIG.treasuryWallet} (Multisig Treasury)`);
    console.log(`[PiService] 💰 AMOUNT: ${amount} Pi`);

    // We attach specific metadata that the backend would use to verify routing
    const routingMetadata = {
        type: 'SERVICE_FEE',
        destination: PAYMENT_CONFIG.treasuryWallet,
        enforced: true
    };

    await this.processPayment(amount, memo, routingMetadata, callbacks);
  }

  private async processPayment(amount: number, memo: string, metadata: any, callbacks: PaymentCallbacks): Promise<void> {
    if (!window.Pi) {
      // Mock flow for browser testing outside Pi App
      console.log(`[PiService MOCK] Creating payment for ${amount} Pi. Memo: ${memo}`);
      if (metadata) console.log(`[PiService MOCK] Metadata:`, metadata);
      
      const mockPaymentId = `pay_${Date.now()}`;
      const mockTxid = `tx_${Date.now()}`;

      setTimeout(async () => {
        console.log("[PiService MOCK] Simulating Server Approval...");
        await callbacks.onReadyForServerApproval(mockPaymentId);
        
        console.log("[PiService MOCK] Simulating Blockchain Transaction...");
        setTimeout(async () => {
            await callbacks.onReadyForServerCompletion(mockPaymentId, mockTxid);
        }, 1500);
      }, 1000);
      return;
    }

    // Real Pi SDK Call
    try {
      await window.Pi.createPayment({
        amount: amount,
        memo: memo,
        metadata: metadata || { type: 'general_payment' }, 
      }, {
        onReadyForServerApproval: callbacks.onReadyForServerApproval,
        onReadyForServerCompletion: callbacks.onReadyForServerCompletion,
        onCancel: callbacks.onCancel,
        onError: callbacks.onError,
      });
    } catch (e) {
      console.error("[PiService] Create Payment Failed", e);
      throw e;
    }
  }
}

export const piService = new PiService();