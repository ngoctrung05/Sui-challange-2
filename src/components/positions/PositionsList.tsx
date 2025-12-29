import { useCurrentAccount } from '@mysten/dapp-kit';
import { Card, Button } from '../common';
import PositionCard from './PositionCard';
import { usePositions } from '../../hooks';

export default function PositionsList() {
  const account = useCurrentAccount();
  const { data: positions, isLoading, error } = usePositions();

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

  if (isLoading) {
    return (
      <Card className="text-center py-12">
        <div className="w-8 h-8 mx-auto mb-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <h3 className="text-lg font-semibold text-white mb-2">Loading Positions</h3>
        <p className="text-[#a0a0a0]">Fetching your liquidity positions...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="text-center py-12">
        <svg
          className="w-16 h-16 mx-auto mb-4 text-red-500"
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
        <h3 className="text-lg font-semibold text-white mb-2">Error Loading Positions</h3>
        <p className="text-[#a0a0a0] mb-4">Failed to load your positions. Please try again.</p>
      </Card>
    );
  }

  if (!positions || positions.length === 0) {
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
        <span className="text-[#a0a0a0]">{positions.length} position{positions.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {positions.map((position) => (
          <PositionCard key={position.id} position={position} />
        ))}
      </div>
    </div>
  );
}
