import { useQuery } from '@tanstack/react-query';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import type { Token } from '../types';
import { formatTokenAmount } from '../utils';

export function useTokenBalance(token?: Token) {
  const account = useCurrentAccount();
  const client = useSuiClient();

  return useQuery({
    queryKey: ['tokenBalance', account?.address, token?.address],
    queryFn: async () => {
      if (!account || !token) return null;

      try {
        // For SUI token
        if (token.address === '0x2::sui::SUI') {
          const balance = await client.getBalance({
            owner: account.address,
          });
          return {
            raw: balance.totalBalance,
            formatted: formatTokenAmount(balance.totalBalance, token.decimals),
          };
        }

        // For other tokens
        const balance = await client.getBalance({
          owner: account.address,
          coinType: token.address,
        });

        return {
          raw: balance.totalBalance,
          formatted: formatTokenAmount(balance.totalBalance, token.decimals),
        };
      } catch (error) {
        console.error('Failed to fetch token balance:', error);
        return { raw: '0', formatted: '0' };
      }
    },
    enabled: !!account && !!token,
    refetchInterval: 10000,
  });
}

export function useAllTokenBalances(tokens: Token[]) {
  const account = useCurrentAccount();
  const client = useSuiClient();

  return useQuery({
    queryKey: ['allTokenBalances', account?.address, tokens.map((t) => t.address)],
    queryFn: async () => {
      if (!account) return [];

      const balances = await Promise.all(
        tokens.map(async (token) => {
          try {
            const coinType = token.address === '0x2::sui::SUI' ? undefined : token.address;
            const balance = await client.getBalance({
              owner: account.address,
              coinType,
            });

            return {
              token,
              balance: balance.totalBalance,
              formatted: formatTokenAmount(balance.totalBalance, token.decimals),
            };
          } catch {
            return {
              token,
              balance: '0',
              formatted: '0',
            };
          }
        })
      );

      return balances;
    },
    enabled: !!account && tokens.length > 0,
    refetchInterval: 10000,
  });
}
