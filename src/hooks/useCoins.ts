import { useQuery } from '@tanstack/react-query';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import type { Token } from '../types';

export interface CoinData {
  objectId: string;
  balance: string;
  coinType: string;
}

export function useCoins(token?: Token) {
  const account = useCurrentAccount();
  const client = useSuiClient();

  return useQuery({
    queryKey: ['coins', account?.address, token?.address],
    queryFn: async (): Promise<CoinData[]> => {
      if (!account || !token) return [];

      try {
        const coins = await client.getCoins({
          owner: account.address,
          coinType: token.address,
        });

        return coins.data.map((coin) => ({
          objectId: coin.coinObjectId,
          balance: coin.balance,
          coinType: coin.coinType,
        }));
      } catch (error) {
        console.error('Failed to fetch coins:', error);
        return [];
      }
    },
    enabled: !!account && !!token,
    refetchInterval: 10000,
  });
}

export function useLargestCoin(token?: Token) {
  const { data: coins, ...rest } = useCoins(token);

  const largestCoin = coins?.reduce<CoinData | null>((largest, coin) => {
    if (!largest) return coin;
    return BigInt(coin.balance) > BigInt(largest.balance) ? coin : largest;
  }, null);

  return {
    data: largestCoin,
    coins,
    ...rest,
  };
}
