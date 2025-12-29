import { useNavigate } from 'react-router-dom';
import type { Position } from '../../types';
import { Card, Button } from '../common';
import { formatTokenAmount, formatUsd, formatPercent } from '../../utils';

interface PositionCardProps {
  position: Position;
}

export default function PositionCard({ position }: PositionCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="hover:border-[#444444] transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {position.pool.tokenA.logoUrl && (
              <img
                src={position.pool.tokenA.logoUrl}
                alt={position.pool.tokenA.symbol}
                className="w-10 h-10 rounded-full border-2 border-[#1a1a1a]"
              />
            )}
            {position.pool.tokenB.logoUrl && (
              <img
                src={position.pool.tokenB.logoUrl}
                alt={position.pool.tokenB.symbol}
                className="w-10 h-10 rounded-full border-2 border-[#1a1a1a]"
              />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-white">
              {position.pool.tokenA.symbol} / {position.pool.tokenB.symbol}
            </h3>
            <p className="text-sm text-[#a0a0a0]">Fee: {position.pool.fee}%</p>
          </div>
        </div>
        {position.valueUsd && (
          <div className="text-right">
            <p className="font-semibold text-white">{formatUsd(position.valueUsd)}</p>
            <p className="text-sm text-green-500">+0.00%</p>
          </div>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#a0a0a0]">{position.pool.tokenA.symbol}</span>
          <span className="text-white">
            {formatTokenAmount(position.tokenAAmount, position.pool.tokenA.decimals)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#a0a0a0]">{position.pool.tokenB.symbol}</span>
          <span className="text-white">
            {formatTokenAmount(position.tokenBAmount, position.pool.tokenB.decimals)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#a0a0a0]">Pool Share</span>
          <span className="text-white">{formatPercent(position.sharePercent)}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" fullWidth onClick={() => navigate('/liquidity?tab=add')}>
          Add
        </Button>
        <Button variant="outline" fullWidth onClick={() => navigate('/liquidity?tab=remove')}>
          Remove
        </Button>
      </div>
    </Card>
  );
}
