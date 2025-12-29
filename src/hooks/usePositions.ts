import { useQuery } from '@tanstack/react-query';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { usePoolsFromRegistry, type PoolData } from './usePoolsFromRegistry';
import { DEX_PACKAGE_ID } from '../constants/config';
import type { Position, Pool } from '../types';

export interface LPCoinData {
  objectId: string;
  balance: string;
  coinType: string;
}

/**
 * Construct LP token type from pool type arguments
 */
const constructLPTokenType = (typeX: string, typeY: string): string => {
  return `${DEX_PACKAGE_ID}::lp_token::LP<${typeX}, ${typeY}>`;
};

/**
 * Convert PoolData to Pool type for compatibility
 */
const poolDataToPool = (poolData: PoolData): Pool | null => {
  if (!poolData.tokenX || !poolData.tokenY) return null;

  return {
    id: poolData.id,
    tokenA: poolData.tokenX,
    tokenB: poolData.tokenY,
    reserveA: poolData.reserveX,
    reserveB: poolData.reserveY,
    totalSupply: poolData.lpSupply,
    fee: poolData.feeBps / 100, // Convert basis points to percentage
  };
};

/**
 * Calculate token amounts from LP balance and pool reserves
 */
const calculateTokenAmounts = (
  lpBalance: bigint,
  totalSupply: bigint,
  reserveA: bigint,
  reserveB: bigint
): { tokenAAmount: string; tokenBAmount: string; sharePercent: number } => {
  if (totalSupply === 0n) {
    return { tokenAAmount: '0', tokenBAmount: '0', sharePercent: 0 };
  }

  const tokenAAmount = (lpBalance * reserveA) / totalSupply;
  const tokenBAmount = (lpBalance * reserveB) / totalSupply;
  const sharePercent = Number((lpBalance * 10000n) / totalSupply) / 100; // Percentage with 2 decimal places

  return {
    tokenAAmount: tokenAAmount.toString(),
    tokenBAmount: tokenBAmount.toString(),
    sharePercent,
  };
};

/**
 * Hook to fetch user's LP token positions across all pools
 */
export function usePositions() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { data: pools } = usePoolsFromRegistry();

  return useQuery({
    queryKey: ['positions', account?.address, pools?.map((p) => p.id).join(',')],
    queryFn: async (): Promise<Position[]> => {
      if (!account || !pools || pools.length === 0) {
        return [];
      }

      const positions: Position[] = [];

      // Fetch LP tokens for each pool
      for (const poolData of pools) {
        try {
          // Construct LP token type
          const lpTokenType = constructLPTokenType(poolData.typeX, poolData.typeY);

          // Fetch user's LP coins of this type
          const lpCoins = await client.getCoins({
            owner: account.address,
            coinType: lpTokenType,
          });

          if (lpCoins.data.length === 0) {
            continue; // User has no LP tokens for this pool
          }

          // Sum all LP coin balances
          const totalLPBalance = lpCoins.data.reduce(
            (sum, coin) => sum + BigInt(coin.balance),
            0n
          );

          if (totalLPBalance === 0n) {
            continue;
          }

          // Convert pool data to Pool type
          const pool = poolDataToPool(poolData);
          if (!pool) continue;

          // Calculate position amounts
          const { tokenAAmount, tokenBAmount, sharePercent } = calculateTokenAmounts(
            totalLPBalance,
            BigInt(poolData.lpSupply),
            BigInt(poolData.reserveX),
            BigInt(poolData.reserveY)
          );

          // Use the first LP coin's objectId as position ID (for remove liquidity)
          const positionId = lpCoins.data[0].coinObjectId;

          positions.push({
            id: positionId,
            pool,
            liquidity: totalLPBalance.toString(),
            tokenAAmount,
            tokenBAmount,
            sharePercent,
            // USD value could be calculated if we had price feeds
          });
        } catch (err) {
          console.error(`Error fetching LP tokens for pool ${poolData.id}:`, err);
        }
      }

      return positions;
    },
    enabled: !!account && !!pools && pools.length > 0,
    refetchInterval: 15000,
    staleTime: 10000,
  });
}

/**
 * Hook to fetch LP coin objects for a specific pool
 */
export function usePoolLPCoins(poolData?: PoolData) {
  const account = useCurrentAccount();
  const client = useSuiClient();

  return useQuery({
    queryKey: ['lpCoins', account?.address, poolData?.id],
    queryFn: async (): Promise<LPCoinData[]> => {
      if (!account || !poolData) return [];

      try {
        const lpTokenType = constructLPTokenType(poolData.typeX, poolData.typeY);

        const lpCoins = await client.getCoins({
          owner: account.address,
          coinType: lpTokenType,
        });

        return lpCoins.data.map((coin) => ({
          objectId: coin.coinObjectId,
          balance: coin.balance,
          coinType: coin.coinType,
        }));
      } catch (error) {
        console.error('Failed to fetch LP coins:', error);
        return [];
      }
    },
    enabled: !!account && !!poolData,
    refetchInterval: 10000,
  });
}

/**
 * Hook to get LP balance for a specific pool
 */
export function usePoolLPBalance(poolData?: PoolData) {
  const { data: lpCoins, ...rest } = usePoolLPCoins(poolData);

  const totalBalance = lpCoins?.reduce(
    (sum, coin) => sum + BigInt(coin.balance),
    0n
  ) || 0n;

  return {
    data: totalBalance.toString(),
    lpCoins,
    ...rest,
  };
}
