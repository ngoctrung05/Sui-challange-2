import { useState, useMemo } from 'react';
import type { Pool } from '../../types';
import { Modal, Spinner } from '../common';
import { usePoolsFromRegistry, type PoolData } from '../../hooks/usePoolsFromRegistry';

interface PoolSelectorProps {
  selectedPool?: Pool;
  onSelect: (pool: Pool) => void;
}

// Convert PoolData from registry to Pool type used by liquidity components
function convertPoolDataToPool(poolData: PoolData): Pool | null {
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
}

export default function PoolSelector({ selectedPool, onSelect }: PoolSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: poolsData, isLoading } = usePoolsFromRegistry();

  // Convert PoolData[] to Pool[]
  const pools = useMemo(() => {
    if (!poolsData) return [];
    return poolsData
      .map(convertPoolDataToPool)
      .filter((pool): pool is Pool => pool !== null);
  }, [poolsData]);

  const handleSelect = (pool: Pool) => {
    onSelect(pool);
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#242424] hover:bg-[#333333] rounded-xl transition-colors"
      >
        {selectedPool ? (
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {selectedPool.tokenA.logoUrl && (
                <img
                  src={selectedPool.tokenA.logoUrl}
                  alt={selectedPool.tokenA.symbol}
                  className="w-8 h-8 rounded-full border-2 border-[#242424]"
                />
              )}
              {selectedPool.tokenB.logoUrl && (
                <img
                  src={selectedPool.tokenB.logoUrl}
                  alt={selectedPool.tokenB.symbol}
                  className="w-8 h-8 rounded-full border-2 border-[#242424]"
                />
              )}
            </div>
            <span className="font-medium text-white">
              {selectedPool.tokenA.symbol} / {selectedPool.tokenB.symbol}
            </span>
          </div>
        ) : (
          <span className="text-[#a0a0a0]">Select a pool</span>
        )}
        <svg className="w-5 h-5 text-[#a0a0a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Select a Pool">
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="md" />
              <span className="ml-2 text-[#a0a0a0]">Loading pools...</span>
            </div>
          ) : pools.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#a0a0a0]">No pools available</p>
              <p className="text-sm text-[#666666] mt-1">Create a pool first from the Pools page</p>
            </div>
          ) : (
            pools.map((pool) => (
              <button
                key={pool.id}
                onClick={() => handleSelect(pool)}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
                  selectedPool?.id === pool.id
                    ? 'bg-indigo-500/20 border border-indigo-500'
                    : 'bg-[#242424] hover:bg-[#333333]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {pool.tokenA.logoUrl ? (
                      <img
                        src={pool.tokenA.logoUrl}
                        alt={pool.tokenA.symbol}
                        className="w-8 h-8 rounded-full border-2 border-[#242424]"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full border-2 border-[#242424] bg-[#333333] flex items-center justify-center text-xs font-medium text-white">
                        {pool.tokenA.symbol.slice(0, 2)}
                      </div>
                    )}
                    {pool.tokenB.logoUrl ? (
                      <img
                        src={pool.tokenB.logoUrl}
                        alt={pool.tokenB.symbol}
                        className="w-8 h-8 rounded-full border-2 border-[#242424]"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full border-2 border-[#242424] bg-[#333333] flex items-center justify-center text-xs font-medium text-white">
                        {pool.tokenB.symbol.slice(0, 2)}
                      </div>
                    )}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-white">
                      {pool.tokenA.symbol} / {pool.tokenB.symbol}
                    </div>
                    <div className="text-sm text-[#a0a0a0]">Fee: {pool.fee}%</div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </Modal>
    </>
  );
}
