import type { Token } from '../types';
import { DEX_PACKAGE_ID, FAUCET_IDS } from './config';

export const TOKENS: Token[] = [
  {
    symbol: 'SUI',
    name: 'Sui',
    decimals: 9,
    address: '0x2::sui::SUI',
    logoUrl: 'https://assets.coingecko.com/coins/images/26375/small/sui_asset.jpeg',
    faucetEnabled: false,
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    address: `${DEX_PACKAGE_ID}::usdc::USDC`,
    logoUrl: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
    faucetEnabled: true,
    faucetAmount: '1000',
    faucetObjectId: FAUCET_IDS.USDC,
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    address: `${DEX_PACKAGE_ID}::usdt::USDT`,
    logoUrl: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
    faucetEnabled: true,
    faucetAmount: '1000',
    faucetObjectId: FAUCET_IDS.USDT,
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 8,
    address: `${DEX_PACKAGE_ID}::eth::ETH`,
    logoUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    faucetEnabled: true,
    faucetAmount: '1',
    faucetObjectId: FAUCET_IDS.ETH,
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    address: `${DEX_PACKAGE_ID}::sol::SOL`,
    logoUrl: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
    faucetEnabled: true,
    faucetAmount: '10',
    faucetObjectId: FAUCET_IDS.SOL,
  },
];

export const FAUCET_TOKENS = TOKENS.filter((token) => token.faucetEnabled);

export const getTokenBySymbol = (symbol: string): Token | undefined => {
  return TOKENS.find((token) => token.symbol === symbol);
};

export const getTokenByAddress = (address: string): Token | undefined => {
  return TOKENS.find((token) => token.address === address);
};
