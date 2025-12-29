export const NETWORK = 'testnet';

export const RPC_URL = 'https://fullnode.testnet.sui.io:443';

// Deployed contract addresses
export const DEX_PACKAGE_ID = '0xd156fa66b5fb9aa573cf87bac9d7ccd2b69056748abecb11c7a75c64ffe19b93';

// Shared objects
export const REGISTRY_ID = '0x36cc043cbe334fedd203755f88dc98a22d799b339fa64d9ee600bcde946d2322';

// Faucet object IDs (shared)
export const FAUCET_IDS = {
  USDC: '0x400a772f2695ab3aa992edcdc018c99d9ae68342fea6e2dea839a85e1e51a2e0',
  SOL: '0xd0dee75992034e665ce5bd509ac905a7a0135368e7d3a49b2e627bdd5b64657a',
  ETH: '0x7156e23d861544af818529c5985138a54f38df8937c3dcff64cbf0e89201a35a',
  USDT: '0x4ee5db9f776b68f2e6595878c486ceb11dfe158877873b1930453276df8e3225',
} as const;

// Clock object (system)
export const CLOCK_ID = '0x6';

export const DEFAULT_SLIPPAGE = 0.5; // 0.5%

export const SLIPPAGE_OPTIONS = [0.1, 0.5, 1.0];

export const MAX_SLIPPAGE = 50; // 50%

export const REFRESH_INTERVAL = 10000; // 10 seconds

// Fee constants (from contract)
export const DEFAULT_FEE_BPS = 30; // 0.3%
export const FEE_DENOMINATOR = 10000;
