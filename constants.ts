import { AppConfig, NetworkType, TokenomicsConfig } from './types';

// Helper to safely access process.env in browser environments
export const getEnv = (key: string, defaultVal: string = '') => {
  try {
    // Check standard process.env (Node/Build time injection)
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      // @ts-ignore
      return process.env[key];
    }
    // Check window.process.env (Runtime shim)
    // @ts-ignore
    if (typeof window !== 'undefined' && window.process && window.process.env && window.process.env[key]) {
      // @ts-ignore
      return window.process.env[key];
    }
    return defaultVal;
  } catch {
    return defaultVal;
  }
};

// ENVIRONMENT VARIABLES
export const ENV = {
  API_KEY: getEnv('API_KEY'), 
  NETWORK: (getEnv('NETWORK', 'TESTNET') as NetworkType),
  PI_APP_ID: getEnv('PI_APP_ID', 'architex_pi_app_v1'),
  PI_BACKEND_URL: getEnv('PI_BACKEND_URL', 'https://api.architex.protocol/v1'),
};

export const TOKENOMICS: TokenomicsConfig = {
  tokenId: 'ARTX_TOKEN_ID',
  maxSupply: 1000000000, // 1 Billion
  distributions: {
    liquidityPool: 200000000,
    rewardsTreasury: 350000000,
    teamFounders: 200000000,
    strategicReserve: 150000000,
    marketingPartners: 100000000,
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
  piNetwork: {
    appId: ENV.PI_APP_ID,
    backendUrl: ENV.PI_BACKEND_URL,
  }
};

export const PAYMENT_CONFIG = {
  downloadCost: 0.50, // Pi
  recipient: 'ARCHITEX_TREASURY_WALLET',
  memo: 'Architex Design Download'
};

export const STELLAR_CONFIG = {
  // Horizon URL removed as we now use Pi SDK exclusively
  assets: {
    ARTX: {
      code: 'ARTX',
      issuer: 'ARCHITEX_ISSUER_ADDRESS' 
    },
    PI: {
      code: 'Pi',
      issuer: undefined 
    }
  }
};

// UI Constants
export const UI_CONSTANTS = {
    glassClass: "glass-panel rounded-xl backdrop-blur-md border border-white/10",
    textGradient: "bg-clip-text text-transparent bg-gradient-to-r from-neon-cyan via-purple-500 to-neon-pink",
};

export const VISION_CONFIG = {
    scanIntervalMs: 500, // Process frame every 500ms
};