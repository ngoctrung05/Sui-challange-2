import type { Pool } from '../types';
import { TOKENS } from './tokens';

export const MOCK_POOLS: Pool[] = [
  {
    id: '0xpool1',
    tokenA: TOKENS[0], // SUI
    tokenB: TOKENS[1], // USDC
    reserveA: '1000000000000000', // 1M SUI
    reserveB: '4000000000000', // 4M USDC
    totalSupply: '2000000000000000',
    fee: 0.3,
  },
  {
    id: '0xpool2',
    tokenA: TOKENS[0], // SUI
    tokenB: TOKENS[2], // USDT
    reserveA: '500000000000000', // 500K SUI
    reserveB: '2000000000000', // 2M USDT
    totalSupply: '1000000000000000',
    fee: 0.3,
  },
  {
    id: '0xpool3',
    tokenA: TOKENS[1], // USDC
    tokenB: TOKENS[2], // USDT
    reserveA: '10000000000000', // 10M USDC
    reserveB: '10000000000000', // 10M USDT
    totalSupply: '10000000000000000',
    fee: 0.05,
  },
  {
    id: '0xpool4',
    tokenA: TOKENS[0], // SUI
    tokenB: TOKENS[3], // WETH
    reserveA: '2000000000000000', // 2M SUI
    reserveB: '500000000000', // 5K WETH
    totalSupply: '1000000000000000',
    fee: 0.3,
  },
];

export const getPoolByTokens = (tokenAAddress: string, tokenBAddress: string): Pool | undefined => {
  return MOCK_POOLS.find(
    (pool) =>
      (pool.tokenA.address === tokenAAddress && pool.tokenB.address === tokenBAddress) ||
      (pool.tokenA.address === tokenBAddress && pool.tokenB.address === tokenAAddress)
  );
};
