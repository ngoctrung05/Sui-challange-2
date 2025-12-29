import type { Pool, Position } from '../../types';
import { Modal, Button } from '../common';

interface AddLiquidityConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  pool: Pool;
  tokenAAmount: string;
  tokenBAmount: string;
  sharePercent: string;
  isLoading?: boolean;
}

export function AddLiquidityConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  pool,
  tokenAAmount,
  tokenBAmount,
  sharePercent,
  isLoading = false,
}: AddLiquidityConfirmProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Add Liquidity">
      <div className="space-y-4">
        <div className="bg-[#242424] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {pool.tokenA.logoUrl && (
                <img src={pool.tokenA.logoUrl} alt={pool.tokenA.symbol} className="w-6 h-6 rounded-full" />
              )}
              <span className="text-[#a0a0a0]">{pool.tokenA.symbol}</span>
            </div>
            <span className="font-medium text-white">{tokenAAmount}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {pool.tokenB.logoUrl && (
                <img src={pool.tokenB.logoUrl} alt={pool.tokenB.symbol} className="w-6 h-6 rounded-full" />
              )}
              <span className="text-[#a0a0a0]">{pool.tokenB.symbol}</span>
            </div>
            <span className="font-medium text-white">{tokenBAmount}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-[#a0a0a0]">Share of Pool</span>
          <span className="text-white">{sharePercent}%</span>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button fullWidth onClick={onConfirm} loading={isLoading}>
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface RemoveLiquidityConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  position: Position;
  percentage: number;
  tokenAReceive: string;
  tokenBReceive: string;
  isLoading?: boolean;
}

export function RemoveLiquidityConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  position,
  percentage,
  tokenAReceive,
  tokenBReceive,
  isLoading = false,
}: RemoveLiquidityConfirmProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Remove Liquidity">
      <div className="space-y-4">
        <div className="text-center py-4">
          <div className="text-4xl font-bold text-white">{percentage}%</div>
          <div className="text-[#a0a0a0]">of your position</div>
        </div>

        <div className="bg-[#242424] rounded-xl p-4 space-y-3">
          <div className="text-sm text-[#a0a0a0] mb-2">You will receive</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {position.pool.tokenA.logoUrl && (
                <img
                  src={position.pool.tokenA.logoUrl}
                  alt={position.pool.tokenA.symbol}
                  className="w-6 h-6 rounded-full"
                />
              )}
              <span className="text-white">{position.pool.tokenA.symbol}</span>
            </div>
            <span className="font-medium text-white">{tokenAReceive}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {position.pool.tokenB.logoUrl && (
                <img
                  src={position.pool.tokenB.logoUrl}
                  alt={position.pool.tokenB.symbol}
                  className="w-6 h-6 rounded-full"
                />
              )}
              <span className="text-white">{position.pool.tokenB.symbol}</span>
            </div>
            <span className="font-medium text-white">{tokenBReceive}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button fullWidth onClick={onConfirm} loading={isLoading}>
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  );
}
