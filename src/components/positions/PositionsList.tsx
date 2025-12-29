import { useCurrentAccount } from '@mysten/dapp-kit';
import type { Position } from '../../types';
import { Card, Button } from '../common';
import PositionCard from './PositionCard';
import { MOCK_POOLS } from '../../constants';

const MOCK_POSITIONS: Position[] = [
  {
    id: '0xpos1',
    pool: MOCK_POOLS[0],
    liquidity: '1000000000',
    tokenAAmount: '500000000000',
    tokenBAmount: '2000000000',
    sharePercent: 0.05,
    valueUsd: '4000',
  },
  {
    id: '0xpos2',
    pool: MOCK_POOLS[1],
    liquidity: '500000000',
    tokenAAmount: '250000000000',
    tokenBAmount: '1000000000',
    sharePercent: 0.025,
    valueUsd: '2000',
  },
];

export default function PositionsList() {
  const account = useCurrentAccount();

  if (!account) {
    return (
      <Card className="text-center py-12">
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
            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-white mb-2">Connect Wallet</h3>
        <p className="text-[#a0a0a0] mb-4">Connect your wallet to view your liquidity positions</p>
      </Card>
    );
  }

  if (MOCK_POSITIONS.length === 0) {
    return (
      <Card className="text-center py-12">
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
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <h3 className="text-lg font-semibold text-white mb-2">No Positions Found</h3>
        <p className="text-[#a0a0a0] mb-4">You don't have any liquidity positions yet</p>
        <Button>Add Liquidity</Button>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Your Positions</h2>
        <span className="text-[#a0a0a0]">{MOCK_POSITIONS.length} positions</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {MOCK_POSITIONS.map((position) => (
          <PositionCard key={position.id} position={position} />
        ))}
      </div>
    </div>
  );
}
