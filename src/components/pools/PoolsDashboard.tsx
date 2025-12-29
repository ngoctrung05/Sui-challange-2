import { useState } from 'react';
import { usePoolsFromRegistry, useRegistryPoolCount } from '../../hooks/usePoolsFromRegistry';
import PoolCard from './PoolCard';
import CreatePoolCard from './CreatePoolCard';
import { Card, Spinner, Modal } from '../common';
import type { PoolData } from '../../hooks/usePoolsFromRegistry';

export default function PoolsDashboard() {
  const { data: pools, isLoading, error, refetch } = usePoolsFromRegistry();
  const { data: poolCount } = useRegistryPoolCount();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleAddLiquidity = (pool: PoolData) => {
    // Navigate to liquidity page with pool pre-selected
    window.location.href = `/liquidity?pool=${pool.id}`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Liquidity Pools</h1>
          <p className="text-[#a0a0a0]">
            {poolCount !== undefined ? `${poolCount} pools` : 'Loading...'} registered
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Pool
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-white">{poolCount || 0}</p>
          <p className="text-sm text-[#a0a0a0]">Total Pools</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-white">
            {pools?.filter((p) => BigInt(p.reserveX) > 0).length || 0}
          </p>
          <p className="text-sm text-[#a0a0a0]">Active Pools</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-white">0.3%</p>
          <p className="text-sm text-[#a0a0a0]">Default Fee</p>
        </Card>
      </div>

      {/* Pools List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
          <span className="ml-3 text-[#a0a0a0]">Loading pools...</span>
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <svg
            className="w-12 h-12 mx-auto mb-4 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-white mb-2">Error Loading Pools</h3>
          <p className="text-[#a0a0a0] mb-4">{String(error)}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors"
          >
            Try Again
          </button>
        </Card>
      ) : pools && pools.length > 0 ? (
        <div className="space-y-4">
          {pools.map((pool) => (
            <PoolCard
              key={pool.id}
              pool={pool}
              onAddLiquidity={handleAddLiquidity}
            />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-[#333333]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 className="text-lg font-semibold text-white mb-2">No Pools Found</h3>
          <p className="text-[#a0a0a0] mb-4">
            Be the first to create a liquidity pool!
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors"
          >
            Create First Pool
          </button>
        </Card>
      )}

      {/* Create Pool Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title=""
      >
        <CreatePoolCard />
      </Modal>
    </div>
  );
}
