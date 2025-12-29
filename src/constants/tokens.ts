import type { Token } from '../types';

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
    address: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',
    logoUrl: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
    faucetEnabled: true,
    faucetAmount: '1000',
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    address: '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN',
    logoUrl: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
    faucetEnabled: true,
    faucetAmount: '1000',
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 8,
    address: '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN',
    logoUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    faucetEnabled: true,
    faucetAmount: '1',
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    address: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef::sol::SOL',
    logoUrl: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
    faucetEnabled: true,
    faucetAmount: '10',
  },
  {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    decimals: 8,
    address: '0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN',
    logoUrl: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png',
    faucetEnabled: false,
  },
];

export const FAUCET_TOKENS = TOKENS.filter((token) => token.faucetEnabled);

export const getTokenBySymbol = (symbol: string): Token | undefined => {
  return TOKENS.find((token) => token.symbol === symbol);
};

export const getTokenByAddress = (address: string): Token | undefined => {
  return TOKENS.find((token) => token.address === address);
};
