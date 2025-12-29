import { PositionsList, TokenBalances } from '../components/positions';

export default function PositionsPage() {
  return (
    <div className="py-8 space-y-8">
      <PositionsList />
      <TokenBalances />
    </div>
  );
}
