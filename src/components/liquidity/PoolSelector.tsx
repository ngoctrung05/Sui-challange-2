import { useState } from 'react';
import type { Pool } from '../../types';
import { Modal } from '../common';
import { MOCK_POOLS } from '../../constants';

interface PoolSelectorProps {
  selectedPool?: Pool;
  onSelect: (pool: Pool) => void;
}

export default function PoolSelector({ selectedPool, onSelect }: PoolSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

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
          {MOCK_POOLS.map((pool) => (
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
                  {pool.tokenA.logoUrl && (
                    <img
                      src={pool.tokenA.logoUrl}
                      alt={pool.tokenA.symbol}
                      className="w-8 h-8 rounded-full border-2 border-[#242424]"
                    />
                  )}
                  {pool.tokenB.logoUrl && (
                    <img
                      src={pool.tokenB.logoUrl}
                      alt={pool.tokenB.symbol}
                      className="w-8 h-8 rounded-full border-2 border-[#242424]"
                    />
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
          ))}
        </div>
      </Modal>
    </>
  );
}
