import { useState, useMemo } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import type { Position } from '../../types';
import { Card, Button, Modal } from '../common';
import { RemoveLiquidityConfirmModal } from './LiquidityConfirmModal';
import { removeLiquidity } from '../../services/contract';
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

const PERCENTAGE_OPTIONS = [25, 50, 75, 100];

export default function RemoveLiquidityCard() {
  const account = useCurrentAccount();

  const [selectedPosition, setSelectedPosition] = useState<Position | undefined>();
  const [percentage, setPercentage] = useState(0);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const tokenAReceive = useMemo(() => {
    if (!selectedPosition) return '0';
    return ((parseFloat(selectedPosition.tokenAAmount) * percentage) / 100 / Math.pow(10, selectedPosition.pool.tokenA.decimals)).toFixed(6);
  }, [selectedPosition, percentage]);

  const tokenBReceive = useMemo(() => {
    if (!selectedPosition) return '0';
    return ((parseFloat(selectedPosition.tokenBAmount) * percentage) / 100 / Math.pow(10, selectedPosition.pool.tokenB.decimals)).toFixed(6);
  }, [selectedPosition, percentage]);

  const handleRemoveLiquidity = async () => {
    if (!selectedPosition) return;

    setIsLoading(true);
    try {
      await removeLiquidity({
        position: selectedPosition,
        percentage,
        minTokenAAmount: '0',
        minTokenBAmount: '0',
        slippage: 0.5,
      });
      setPercentage(0);
      setSelectedPosition(undefined);
      setShowConfirm(false);
    } catch (error) {
      console.error('Remove liquidity failed:', error);
      alert('Remove liquidity failed. Please check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonDisabled = !account || !selectedPosition || percentage === 0;

  const getButtonText = () => {
    if (!account) return 'Connect Wallet';
    if (!selectedPosition) return 'Select a position';
    if (percentage === 0) return 'Select amount';
    return 'Remove Liquidity';
  };

  return (
    <>
      <Card className="max-w-md mx-auto">
        <h2 className="text-xl font-semibold text-white mb-4">Remove Liquidity</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#a0a0a0] mb-2">Select Position</label>
            <button
              onClick={() => setShowPositionModal(true)}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#242424] hover:bg-[#333333] rounded-xl transition-colors"
            >
              {selectedPosition ? (
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {selectedPosition.pool.tokenA.logoUrl && (
                      <img
                        src={selectedPosition.pool.tokenA.logoUrl}
                        alt={selectedPosition.pool.tokenA.symbol}
                        className="w-8 h-8 rounded-full border-2 border-[#242424]"
                      />
                    )}
                    {selectedPosition.pool.tokenB.logoUrl && (
                      <img
                        src={selectedPosition.pool.tokenB.logoUrl}
                        alt={selectedPosition.pool.tokenB.symbol}
                        className="w-8 h-8 rounded-full border-2 border-[#242424]"
                      />
                    )}
                  </div>
                  <span className="font-medium text-white">
                    {selectedPosition.pool.tokenA.symbol} / {selectedPosition.pool.tokenB.symbol}
                  </span>
                </div>
              ) : (
                <span className="text-[#a0a0a0]">Select a position</span>
              )}
              <svg className="w-5 h-5 text-[#a0a0a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {selectedPosition && (
            <>
              <div>
                <label className="block text-sm text-[#a0a0a0] mb-3">Amount to Remove</label>
                <div className="text-center mb-4">
                  <span className="text-4xl font-bold text-white">{percentage}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={percentage}
                  onChange={(e) => setPercentage(parseInt(e.target.value))}
                  className="w-full h-2 bg-[#333333] rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex gap-2 mt-3">
                  {PERCENTAGE_OPTIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() => setPercentage(option)}
                      className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                        percentage === option
                          ? 'bg-indigo-500 text-white'
                          : 'bg-[#242424] text-[#a0a0a0] hover:bg-[#333333]'
                      }`}
                    >
                      {option}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#242424] rounded-xl p-4 space-y-3">
                <div className="text-sm text-[#a0a0a0] mb-2">You will receive</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {selectedPosition.pool.tokenA.logoUrl && (
                      <img
                        src={selectedPosition.pool.tokenA.logoUrl}
                        alt={selectedPosition.pool.tokenA.symbol}
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <span className="text-white">{selectedPosition.pool.tokenA.symbol}</span>
                  </div>
                  <span className="font-medium text-white">{tokenAReceive}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {selectedPosition.pool.tokenB.logoUrl && (
                      <img
                        src={selectedPosition.pool.tokenB.logoUrl}
                        alt={selectedPosition.pool.tokenB.symbol}
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <span className="text-white">{selectedPosition.pool.tokenB.symbol}</span>
                  </div>
                  <span className="font-medium text-white">{tokenBReceive}</span>
                </div>
              </div>
            </>
          )}

          <Button fullWidth size="lg" disabled={isButtonDisabled} onClick={() => setShowConfirm(true)}>
            {getButtonText()}
          </Button>
        </div>
      </Card>

      <Modal
        isOpen={showPositionModal}
        onClose={() => setShowPositionModal(false)}
        title="Select Position"
      >
        <div className="space-y-2">
          {MOCK_POSITIONS.length === 0 ? (
            <p className="text-center text-[#a0a0a0] py-4">No positions found</p>
          ) : (
            MOCK_POSITIONS.map((position) => (
              <button
                key={position.id}
                onClick={() => {
                  setSelectedPosition(position);
                  setShowPositionModal(false);
                }}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
                  selectedPosition?.id === position.id
                    ? 'bg-indigo-500/20 border border-indigo-500'
                    : 'bg-[#242424] hover:bg-[#333333]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {position.pool.tokenA.logoUrl && (
                      <img
                        src={position.pool.tokenA.logoUrl}
                        alt={position.pool.tokenA.symbol}
                        className="w-8 h-8 rounded-full border-2 border-[#242424]"
                      />
                    )}
                    {position.pool.tokenB.logoUrl && (
                      <img
                        src={position.pool.tokenB.logoUrl}
                        alt={position.pool.tokenB.symbol}
                        className="w-8 h-8 rounded-full border-2 border-[#242424]"
                      />
                    )}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-white">
                      {position.pool.tokenA.symbol} / {position.pool.tokenB.symbol}
                    </div>
                    <div className="text-sm text-[#a0a0a0]">
                      Share: {position.sharePercent}%
                    </div>
                  </div>
                </div>
                {position.valueUsd && (
                  <span className="text-white font-medium">${position.valueUsd}</span>
                )}
              </button>
            ))
          )}
        </div>
      </Modal>

      {selectedPosition && (
        <RemoveLiquidityConfirmModal
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleRemoveLiquidity}
          position={selectedPosition}
          percentage={percentage}
          tokenAReceive={tokenAReceive}
          tokenBReceive={tokenBReceive}
          isLoading={isLoading}
        />
      )}
    </>
  );
}
