


import { LegalAgreement } from "../types";

export interface ContractParams {
  type: 'IP_TRANSFER' | 'SERVICE_AGREEMENT' | 'NDA';
  initiator: string;
  counterparty: string;
  projectScope: string;
  value: string;
  jurisdiction: string;
}

class LegalService {
  private agreements: LegalAgreement[] = [];

  /**
   * DIGITAL IMMUNITY PROTOCOL
   * Returns the immutable Terms of Service for the "Venue Only" agreement.
   */
  getDigitalImmunityTerms(): string {
      return `
ARCHITEX DIGITAL IMMUNITY PROTOCOL (TERMS OF SERVICE)

1. VENUE ONLY AGREEMENT (The "Intermediary Clause")
   By accessing the Architex Protocol, you explicitly acknowledge that Architex is a decentralized software interface ("Venue") connecting independent users. Architex is NOT a party to any contract, bounty, or service agreement between users. All contractual obligations are solely between the Client and the Service Provider.

2. NO WARRANTY & DISCLAIMER
   Architex provides this software "AS IS", without warranty of any kind, express or implied. We disclaim all liability for:
   - The quality, safety, or legality of services provided by users.
   - Financial losses due to smart contract execution or Pi Network downtime.
   - The structural integrity or code compliance of any AI-generated blueprints.

3. AI COMPLIANCE NOTICE
   AI-generated designs are for conceptual purposes only. You agree to obtain verification from a licensed professional before any physical construction.

4. ARBITRATION & DISPUTES
   You agree to resolve all disputes via the Architex DAO Decentralized Arbitration system. The decision of the Arbitrator (human or AI) is final and binding within the scope of the protocol's escrowed funds.

5. CRYPTOGRAPHIC CONSENT
   Your digital signature on this agreement serves as immutable proof of your acceptance of these terms on the Pi Network blockchain.
      `.trim();
  }

  /**
   * Generates the legal text based on dynamic inputs.
   */
  generateTemplate(params: ContractParams): string {
    const date = new Date().toLocaleDateString();
    
    if (params.type === 'IP_TRANSFER') {
      return `
INTELLECTUAL PROPERTY TRANSFER AGREEMENT

This Agreement is made on ${date} between:
TRANSFEROR: ${params.initiator}
TRANSFEREE: ${params.counterparty}

1. ASSIGNMENT
The Transferor hereby assigns, sells, and transfers to the Transferee all rights, title, and interest in the Project known as "${params.projectScope}".

2. CONSIDERATION
This transfer is executed for the consideration of ${params.value}, receipt of which is acknowledged upon blockchain verification.

3. DIGITAL ASSETS
This agreement specifically covers the 3D Blueprints, CAD files, and associated NFTs minted on the Architex Protocol.

4. JURISDICTION
This agreement is governed by the laws of ${params.jurisdiction} and the immutable code of the Pi Network Smart Contract system.

Signed digitally via Architex Legal Engine.
      `.trim();
    }

    if (params.type === 'SERVICE_AGREEMENT') {
      return `
PROFESSIONAL ARCHITECTURAL SERVICES AGREEMENT

Date: ${date}
Client: ${params.initiator}
Architect/Designer: ${params.counterparty}

1. SCOPE OF WORK
The Designer agrees to provide the following services: ${params.projectScope}.

2. COMPENSATION
The Client agrees to pay the sum of ${params.value} via the Architex Bounty Escrow System.

3. DELIVERABLES
Final deliverables shall be provided in industry-standard formats (OBJ, FBX, PDF) and cryptographically signed.

4. DISPUTE RESOLUTION
Disputes shall be resolved via the Architex DAO Arbitration Protocol.

GOVERNING LAW: ${params.jurisdiction}
      `.trim();
    }

    return "Agreement Type Not Supported";
  }

  /**
   * Calculates SHA-256 Hash of the content.
   * This hash is the "Digital Fingerprint" stored on-chain.
   */
  async computeHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  /**
   * Creates a draft agreement.
   */
  async createDraft(params: ContractParams): Promise<LegalAgreement> {
    const content = this.generateTemplate(params);
    const hash = await this.computeHash(content);

    const agreement: LegalAgreement = {
      id: `contract_${Date.now()}`,
      type: params.type,
      parties: {
        initiator: params.initiator,
        counterparty: params.counterparty
      },
      content: content,
      contentHash: hash,
      status: 'DRAFT',
      timestamp: Date.now()
    };

    this.agreements.push(agreement);
    return agreement;
  }

  /**
   * SIMULATED BLOCKCHAIN NOTARIZATION
   * Sends the Content Hash to the blockchain (Stellar Memo or Data Entry).
   */
  async notarizeAgreement(agreementId: string, signature: string): Promise<LegalAgreement> {
    // Simulate Network Delay
    await new Promise(r => setTimeout(r, 2000));

    const idx = this.agreements.findIndex(a => a.id === agreementId);
    if (idx === -1) throw new Error("Agreement not found");

    const agreement = this.agreements[idx];
    
    // Simulate Ledger Entry
    const mockTxId = `tx_${Math.random().toString(36).substring(2, 15)}_block_${Date.now()}`;
    
    // Update State
    agreement.status = 'NOTARIZED';
    agreement.signature = signature;
    agreement.blockchainTxId = mockTxId;
    
    this.agreements[idx] = agreement;
    return agreement;
  }

  getAgreements(): LegalAgreement[] {
    return this.agreements;
  }
}

export const legalService = new LegalService();