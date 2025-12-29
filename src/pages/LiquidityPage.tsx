import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AddLiquidityCard, RemoveLiquidityCard } from '../components/liquidity';

type Tab = 'add' | 'remove';

export default function LiquidityPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as Tab) || 'add';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="py-8">
      <div className="max-w-md mx-auto mb-6">
        <div className="flex bg-[#1a1a1a] rounded-xl p-1">
          <button
            onClick={() => handleTabChange('add')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              activeTab === 'add' ? 'bg-[#242424] text-white' : 'text-[#a0a0a0] hover:text-white'
            }`}
          >
            Add Liquidity
          </button>
          <button
            onClick={() => handleTabChange('remove')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              activeTab === 'remove' ? 'bg-[#242424] text-white' : 'text-[#a0a0a0] hover:text-white'
            }`}
          >
            Remove Liquidity
          </button>
        </div>
      </div>

      {activeTab === 'add' ? <AddLiquidityCard /> : <RemoveLiquidityCard />}
    </div>
  );
}
