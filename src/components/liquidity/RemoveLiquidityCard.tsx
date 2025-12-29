import { useState, useMemo } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import type { Position } from '../../types';
import { Card, Button, Modal } from '../common';
import { RemoveLiquidityConfirmModal } from './LiquidityConfirmModal';
import { DEX_PACKAGE_ID } from '../../constants';
import { useToast } from '../../contexts/ToastContext';
import { usePositions } from '../../hooks';

const PERCENTAGE_OPTIONS = [25, 50, 75, 100];

export default function RemoveLiquidityCard() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const { showTxSuccess, showError } = useToast();
  const { data: positions, isLoading: positionsLoading } = usePositions();

  const [selectedPosition, setSelectedPosition] = useState<Position | undefined>();
  const [percentage, setPercentage] = useState(0);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tokenAReceive = useMemo(() => {
    if (!selectedPosition) return '0';
    return ((parseFloat(selectedPosition.tokenAAmount) * percentage) / 100 / Math.pow(10, selectedPosition.pool.tokenA.decimals)).toFixed(6);
  }, [selectedPosition, percentage]);

  const tokenBReceive = useMemo(() => {
    if (!selectedPosition) return '0';
    return ((parseFloat(selectedPosition.tokenBAmount) * percentage) / 100 / Math.pow(10, selectedPosition.pool.tokenB.decimals)).toFixed(6);
  }, [selectedPosition, percentage]);

  // Validate Sui object ID format
  const isValidPoolId = (id: string): boolean => {
    return typeof id === 'string' && /^0x[a-fA-F0-9]{64}$/.test(id);
  };

  const handleRemoveLiquidity = async () => {
    if (!selectedPosition || !account) return;

    // Validate pool ID before proceeding
    if (!isValidPoolId(selectedPosition.pool.id)) {
      const errMsg = `Invalid pool ID: ${selectedPosition.pool.id}`;
      console.error(errMsg);
      setError('Invalid pool in position. Please select a valid position.');
      showError('Remove Liquidity Failed', 'Invalid pool ID');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const tx = new Transaction();

      // Calculate LP amount to burn based on percentage
      const lpAmountToBurn = BigInt(
        Math.floor((parseFloat(selectedPosition.liquidity) * percentage) / 100)
      );

      // Get LP token type for this pool
      const lpTokenType = `${DEX_PACKAGE_ID}::lp_token::LP<${selectedPosition.pool.tokenA.address}, ${selectedPosition.pool.tokenB.address}>`;

      // Get user's LP tokens
      const lpCoins = await client.getCoins({
        owner: account.address,
        coinType: lpTokenType,
      });

      if (lpCoins.data.length === 0) {
        throw new Error('No LP tokens found for this pool');
      }

      // Prepare LP coin for burning
      let lpCoin;
      if (lpCoins.data.length > 1) {
        const primaryCoin = tx.object(lpCoins.data[0].coinObjectId);
        tx.mergeCoins(primaryCoin, lpCoins.data.slice(1).map((c) => tx.object(c.coinObjectId)));
        [lpCoin] = tx.splitCoins(primaryCoin, [tx.pure.u64(lpAmountToBurn)]);
      } else if (BigInt(lpCoins.data[0].balance) > lpAmountToBurn) {
        [lpCoin] = tx.splitCoins(tx.object(lpCoins.data[0].coinObjectId), [tx.pure.u64(lpAmountToBurn)]);
      } else {
        lpCoin = tx.object(lpCoins.data[0].coinObjectId);
      }

      // Remove liquidity
      const [coinA, coinB] = tx.moveCall({
        target: `${DEX_PACKAGE_ID}::liquidity::remove_liquidity`,
        typeArguments: [
          selectedPosition.pool.tokenA.address,
          selectedPosition.pool.tokenB.address,
        ],
        arguments: [
          tx.object(selectedPosition.pool.id),
          lpCoin,
        ],
      });

      // Transfer received coins to sender
      tx.transferObjects([coinA, coinB], account.address);

      const result = await signAndExecute({
        transaction: tx,
      });

      console.log('Remove liquidity result:', result);

      // Show toast with SuiVision link
      showTxSuccess(
        'Liquidity Removed',
        result.digest,
        `Removed ${percentage}% from ${selectedPosition.pool.tokenA.symbol}/${selectedPosition.pool.tokenB.symbol} pool`
      );

      setPercentage(0);
      setSelectedPosition(undefined);
      setShowConfirm(false);
    } catch (err) {
      console.error('Remove liquidity failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to remove liquidity: ${errorMessage}`);
      showError('Remove Liquidity Failed', errorMessage);
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

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

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
          {positionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="ml-2 text-[#a0a0a0]">Loading positions...</span>
            </div>
          ) : !positions || positions.length === 0 ? (
            <p className="text-center text-[#a0a0a0] py-4">No positions found</p>
          ) : (
            positions.map((position) => (
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
