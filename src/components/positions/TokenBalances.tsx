import { useCurrentAccount } from '@mysten/dapp-kit';
import type { TokenBalance } from '../../types';
import { Card } from '../common';
import { TOKENS } from '../../constants';
import { formatTokenAmount, formatUsd } from '../../utils';

const MOCK_BALANCES: TokenBalance[] = TOKENS.map((token) => ({
  token,
  balance: token.symbol === 'SUI' ? '10000000000' : '1000000',
  balanceUsd: token.symbol === 'SUI' ? '40' : '1',
}));

export default function TokenBalances() {
  const account = useCurrentAccount();

  if (!account) {
    return (
      <Card className="text-center py-8">
        <p className="text-[#a0a0a0]">Connect wallet to view balances</p>
      </Card>
    );
  }

  const totalValue = MOCK_BALANCES.reduce(
    (sum, b) => sum + parseFloat(b.balanceUsd || '0'),
    0
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Token Balances</h2>
        <span className="text-white font-medium">{formatUsd(totalValue)}</span>
      </div>
      <Card padding="none">
        <div className="divide-y divide-[#333333]">
          {MOCK_BALANCES.map((item) => (
            <div key={item.token.address} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                {item.token.logoUrl ? (
                  <img
                    src={item.token.logoUrl}
                    alt={item.token.symbol}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#333333] flex items-center justify-center text-sm font-medium">
                    {item.token.symbol.slice(0, 2)}
                  </div>
                )}
                <div>
                  <p className="font-medium text-white">{item.token.symbol}</p>
                  <p className="text-sm text-[#a0a0a0]">{item.token.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-white">
                  {formatTokenAmount(item.balance, item.token.decimals)}
                </p>
                {item.balanceUsd && (
                  <p className="text-sm text-[#a0a0a0]">{formatUsd(item.balanceUsd)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
