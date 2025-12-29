import type { PoolData } from '../../hooks/usePoolsFromRegistry';
import { Card } from '../common';
import { formatTokenAmount } from '../../utils';

interface PoolCardProps {
  pool: PoolData;
  onAddLiquidity?: (pool: PoolData) => void;
}

export default function PoolCard({ pool, onAddLiquidity }: PoolCardProps) {
  const tokenXSymbol = pool.tokenX?.symbol || pool.typeX.split('::').pop() || 'Unknown';
  const tokenYSymbol = pool.tokenY?.symbol || pool.typeY.split('::').pop() || 'Unknown';

  const reserveXFormatted = formatTokenAmount(pool.reserveX, pool.tokenX?.decimals || 9);
  const reserveYFormatted = formatTokenAmount(pool.reserveY, pool.tokenY?.decimals || 9);

  const lpSupplyFormatted = formatTokenAmount(pool.lpSupply, 9);

  // Calculate TVL estimate (simplified - just showing reserves)
  const hasLiquidity = BigInt(pool.reserveX) > 0 && BigInt(pool.reserveY) > 0;

  return (
    <Card className="p-4 hover:border-indigo-500/50 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {pool.tokenX?.logoUrl ? (
              <img
                src={pool.tokenX.logoUrl}
                alt={tokenXSymbol}
                className="w-10 h-10 rounded-full border-2 border-[#1a1a1a]"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#333333] border-2 border-[#1a1a1a] flex items-center justify-center text-xs font-medium">
                {tokenXSymbol.slice(0, 2)}
              </div>
            )}
            {pool.tokenY?.logoUrl ? (
              <img
                src={pool.tokenY.logoUrl}
                alt={tokenYSymbol}
                className="w-10 h-10 rounded-full border-2 border-[#1a1a1a]"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#333333] border-2 border-[#1a1a1a] flex items-center justify-center text-xs font-medium">
                {tokenYSymbol.slice(0, 2)}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-white">
              {tokenXSymbol} / {tokenYSymbol}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#a0a0a0]">Fee: {pool.feeBps / 100}%</span>
              {pool.isActive ? (
                <span className="px-1.5 py-0.5 text-xs bg-green-500/20 text-green-400 rounded">
                  Active
                </span>
              ) : (
                <span className="px-1.5 py-0.5 text-xs bg-red-500/20 text-red-400 rounded">
                  Inactive
                </span>
              )}
            </div>
          </div>
        </div>

        {onAddLiquidity && (
          <button
            onClick={() => onAddLiquidity(pool)}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Add Liquidity
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#242424] rounded-lg p-3">
          <p className="text-xs text-[#a0a0a0] mb-1">{tokenXSymbol} Reserve</p>
          <p className="text-white font-medium">{reserveXFormatted}</p>
        </div>
        <div className="bg-[#242424] rounded-lg p-3">
          <p className="text-xs text-[#a0a0a0] mb-1">{tokenYSymbol} Reserve</p>
          <p className="text-white font-medium">{reserveYFormatted}</p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-[#333333]">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#a0a0a0]">LP Supply</span>
          <span className="text-white">{lpSupplyFormatted}</span>
        </div>
        {!hasLiquidity && (
          <p className="mt-2 text-xs text-yellow-400">
            This pool has no liquidity yet. Be the first to add!
          </p>
        )}
      </div>
    </Card>
  );
}
