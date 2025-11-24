
import { RFQ, BlindBid, B2BContract } from "../types";

class RFQService {
    private rfqs: RFQ[] = [];

    async createRFQ(title: string, items: { sku: string, quantity: number }[], deadline: number): Promise<RFQ> {
        await new Promise(r => setTimeout(r, 800));
        
        const newRFQ: RFQ = {
            id: `RFQ-${Date.now()}`,
            title,
            items,
            status: 'OPEN',
            createdAt: Date.now(),
            deadline,
            bids: []
        };
        
        this.rfqs.unshift(newRFQ);
        
        // Simulate Incoming Blind Bids (from external suppliers)
        this.simulateIncomingBids(newRFQ.id);
        
        return newRFQ;
    }

    async getRFQs(): Promise<RFQ[]> {
        return [...this.rfqs];
    }

    async awardContract(rfqId: string, bidId: string): Promise<B2BContract> {
        await new Promise(r => setTimeout(r, 1000));
        
        const rfq = this.rfqs.find(r => r.id === rfqId);
        if (!rfq) throw new Error("RFQ Not Found");
        
        const bid = rfq.bids.find(b => b.id === bidId);
        if (!bid) throw new Error("Bid Not Found");

        rfq.status = 'AWARDED';
        rfq.awardedBidId = bidId;

        // Generate B2B Contract
        const contract: B2BContract = {
            id: `CON-B2B-${Date.now()}`,
            rfqId,
            supplier: bid.supplierName,
            buyer: 'MegaCorp Structures',
            totalValue: bid.amount,
            terms: bid.amount > 5000 ? 'NET30' : 'IMMEDIATE',
            dynamicFeeRate: bid.amount > 10000 ? 0.02 : 0.05, // Dynamic Fee Logic
            status: 'ACTIVE'
        };

        return contract;
    }

    private simulateIncomingBids(rfqId: string) {
        setTimeout(() => {
            const rfq = this.rfqs.find(r => r.id === rfqId);
            if (!rfq || rfq.status !== 'OPEN') return;

            const suppliers = ['Global Materials Ltd.', 'EcoSupply Chain', 'SteelWorks Int.'];
            const randomSupplier = suppliers[Math.floor(Math.random() * suppliers.length)];
            
            const mockBid: BlindBid = {
                id: `bid_${Date.now()}`,
                supplierName: randomSupplier,
                amount: Math.floor(Math.random() * 5000) + 1000,
                deliveryDate: Date.now() + 86400000 * 5,
                isSealed: true
            };

            rfq.bids.push(mockBid);
            console.log(`[RFQ] New Blind Bid received for ${rfqId}`);
        }, 5000); // Bid arrives after 5 seconds
    }
}

export const rfqService = new RFQService();
