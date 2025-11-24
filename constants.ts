import { AppConfig, NetworkType, TokenomicsConfig } from './types';

// ENVIRONMENT VARIABLES (Mocked for this architecture demo as per strict requirements)
export const ENV = {
  API_KEY: process.env.API_KEY || '', // Gemini API Key
  NETWORK: (process.env.NETWORK as NetworkType) || NetworkType.TESTNET,
};

export const TOKENOMICS: TokenomicsConfig = {
  tokenId: 'ARTX_TOKEN_ID',
  maxSupply: 100000000, // 100 Million
  distributions: {
    liquidityPool: 20000000,
    rewardsTreasury: 35000000,
    teamFounders: 20000000,
    strategicReserve: 15000000,
    marketingPartners: 10000000,
  },
  vestingRules: {
    liquidityPool: 'Unlocked Immediately (Locked in AMM)',
    rewardsTreasury: 'Drip Feed (Daily Release)',
    teamFounders: '6-Month Cliff, 24-month Linear Vesting',
    strategicReserve: 'Permissioned Cold Wallet (Multi-Sig)',
    marketingPartners: '2% Launch, 1% Monthly',
  },
};

export const CONFIG: AppConfig = {
  network: ENV.NETWORK,
  contracts: {
    vestingVault: 'CB...VESTING',
    centralBank: 'CB...CENTRAL',
    amm: 'CB...AMM',
  },
};

export const UI_CONSTANTS = {
  glassClass: 'glass-panel rounded-xl',
  primaryGradient: 'bg-gradient-to-r from-neon-purple to-neon-pink',
  textGradient: 'bg-clip-text text-transparent bg-gradient-to-r from-neon-cyan to-neon-purple',
};