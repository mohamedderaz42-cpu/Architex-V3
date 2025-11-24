import { dalCreateTrustline, dalGetAccountInfo } from "./dataAccessLayer";
import { UserSession } from "../types";
import { TOKENOMICS } from "../constants";

// The Orchestrator manages the flow between UI and DAL

export const initializeSession = async (): Promise<UserSession> => {
  // 1. Trigger Pi Network Auth (Simulated)
  // 2. Fetch User Data from DAL
  const session = await dalGetAccountInfo();
  return session;
};

export const handleAddTrustline = async (currentSession: UserSession): Promise<UserSession> => {
  if (currentSession.hasTrustline) return currentSession;

  try {
    const success = await dalCreateTrustline(TOKENOMICS.tokenId);
    if (success) {
      return {
        ...currentSession,
        hasTrustline: true,
        balance: 100.00 // Airdrop simulation
      };
    }
    return currentSession;
  } catch (e) {
    console.error("Trustline failed", e);
    throw e;
  }
};