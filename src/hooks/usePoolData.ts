import { useQuery } from '@tanstack/react-query';
import type { Pool } from '../types';

// These hooks are not currently used in the application
// Pool data is fetched via usePoolsFromRegistry() instead

export function usePoolData(_poolId?: string) {
  return useQuery({
    queryKey: ['poolData', _poolId],
    queryFn: async (): Promise<Pool | null> => null,
    enabled: false,
  });
}

export function useAllPools() {
  return useQuery({
    queryKey: ['allPools'],
    queryFn: async (): Promise<Pool[]> => [],
    enabled: false,
  });
}

export function usePoolReserves(_pool?: Pool) {
  return useQuery({
    queryKey: ['poolReserves', _pool?.id],
    queryFn: async () => null,
    enabled: false,
  });
}
