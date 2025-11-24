
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

    if (!window.Pi) {
      // Mock flow for browser testing outside Pi App
      console.log(`[PiService MOCK] Creating payment for ${amount} Pi. Memo: ${memo}`);
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
        metadata: { type: 'digital_download' }, // Developer metadata
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
