import { useQuery } from '@tanstack/react-query';
import type { Pool } from '../types';
import { MOCK_POOLS } from '../constants';

// Note: useSuiClient() will be used when implementing actual chain queries
// import { useSuiClient } from '@mysten/dapp-kit';

export function usePoolData(poolId?: string) {
  return useQuery({
    queryKey: ['poolData', poolId],
    queryFn: async () => {
      if (!poolId) return null;

      // TODO: Implement actual pool data fetching from chain
      // const client = useSuiClient();
      // const poolObject = await client.getObject({
      //   id: poolId,
      //   options: { showContent: true },
      // });
      // Parse and return pool data

      // For now, return mock data
      const mockPool = MOCK_POOLS.find((p) => p.id === poolId);
      return mockPool || null;
    },
    enabled: !!poolId,
    refetchInterval: 10000,
  });
}

export function useAllPools() {
  return useQuery({
    queryKey: ['allPools'],
    queryFn: async () => {
      // TODO: Implement actual pool fetching from chain
      // const client = useSuiClient();
      // Query for all pool objects from the DEX package
      // Parse the pool data
      // Return formatted pool list

      // For now, return mock data
      return MOCK_POOLS;
    },
    refetchInterval: 30000,
  });
}

export function usePoolReserves(pool?: Pool) {
  return useQuery({
    queryKey: ['poolReserves', pool?.id],
    queryFn: async () => {
      if (!pool) return null;

      // TODO: Implement actual reserve fetching
      // This would fetch current reserves from the pool object on chain

      return {
        reserveA: pool.reserveA,
        reserveB: pool.reserveB,
        lastUpdated: Date.now(),
      };
    },
    enabled: !!pool,
    refetchInterval: 5000,
  });
}
