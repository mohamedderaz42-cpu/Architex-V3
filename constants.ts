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

export const CONTRACT_CONFIG = {
  PLATFORM_COMMISSION_RATE: 0.10, // 10% Protocol Fee
  ESCROW_WALLET: 'ARCHITEX_ESCROW_VAULT'
};

export const NFT_CONFIG = {
  MINTING_FEE_ARTX: 100, // Cost to mint in ARTX
  CONTRACT_ADDRESS: 'C...NFT_FACTORY_SOROBAN',
  ROYALTY_PERCENTAGE: 5
};

export const STAKING_CONFIG = {
  POOLS: [
    { 
      id: 'pool_flex', 
      name: 'Flexible Savings', 
      description: 'Stake ARTX with no lock-up period. Withdraw anytime.',
      apy: 5.5, 
      lockPeriodDays: 0, 
      minStake: 10 
    },
    { 
      id: 'pool_validator', 
      name: 'Validator Node Share', 
      description: 'Support network security. 30-day lock-up.',
      apy: 12.0, 
      lockPeriodDays: 30, 
      minStake: 100 
    },
    { 
      id: 'pool_governance', 
      name: 'DAO Governance Vault', 
      description: 'Maximum yield for long-term holders. 90-day lock-up.',
      apy: 24.5, 
      lockPeriodDays: 90, 
      minStake: 500 
    }
  ]
};

export const PAYMENT_CONFIG = {
  downloadCost: 0.50, // Pi
  subscriptionCost: 10.00, // Pi per month
  acceleratorCost: 52.00, // Pi per month (Accelerator Tier)
  // HARDCODED TREASURY WALLET FOR SERVICE FEES
  treasuryWallet: 'ARCHITEX_MULTISIG_TREASURY_G...VERIFIED',
  memo: 'Architex Service Fee'
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