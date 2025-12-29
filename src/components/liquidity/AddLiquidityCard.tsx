import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import type { Pool } from '../../types';
import { Card, Button, TokenInput } from '../common';
import PoolSelector from './PoolSelector';
import { AddLiquidityConfirmModal } from './LiquidityConfirmModal';
import { addLiquidity } from '../../services/contract';
import { isValidAmount } from '../../utils';

export default function AddLiquidityCard() {
  const account = useCurrentAccount();

  const [selectedPool, setSelectedPool] = useState<Pool | undefined>();
  const [tokenAAmount, setTokenAAmount] = useState('');
  const [tokenBAmount, setTokenBAmount] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!selectedPool || !tokenAAmount) {
      setTokenBAmount('');
      return;
    }

    const reserveA = parseFloat(selectedPool.reserveA);
    const reserveB = parseFloat(selectedPool.reserveB);
    const ratio = reserveB / reserveA;
    const calculatedB = (parseFloat(tokenAAmount) * ratio).toFixed(6);
    setTokenBAmount(calculatedB);
  }, [tokenAAmount, selectedPool]);

  const handlePoolSelect = (pool: Pool) => {
    setSelectedPool(pool);
    setTokenAAmount('');
    setTokenBAmount('');
  };

  const handleAddLiquidity = async () => {
    if (!selectedPool) return;

    setIsLoading(true);
    try {
      await addLiquidity({
        pool: selectedPool,
        tokenAAmount,
        tokenBAmount,
        minLpTokens: '0',
        slippage: 0.5,
      });
      setTokenAAmount('');
      setTokenBAmount('');
      setShowConfirm(false);
    } catch (error) {
      console.error('Add liquidity failed:', error);
      alert('Add liquidity failed. Please check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const estimatedShare = selectedPool
    ? ((parseFloat(tokenAAmount || '0') / (parseFloat(selectedPool.reserveA) + parseFloat(tokenAAmount || '0'))) * 100).toFixed(4)
    : '0';

  const isButtonDisabled = !account || !selectedPool || !isValidAmount(tokenAAmount);

  const getButtonText = () => {
    if (!account) return 'Connect Wallet';
    if (!selectedPool) return 'Select a pool';
    if (!isValidAmount(tokenAAmount)) return 'Enter amount';
    return 'Add Liquidity';
  };

  return (
    <>
      <Card className="max-w-md mx-auto">
        <h2 className="text-xl font-semibold text-white mb-4">Add Liquidity</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#a0a0a0] mb-2">Select Pool</label>
            <PoolSelector selectedPool={selectedPool} onSelect={handlePoolSelect} />
          </div>

          {selectedPool && (
            <>
              <TokenInput
                label={`${selectedPool.tokenA.symbol} Amount`}
                token={selectedPool.tokenA}
                onTokenSelect={() => {}}
                amount={tokenAAmount}
                onAmountChange={setTokenAAmount}
                balance="0.00"
              />

              <TokenInput
                label={`${selectedPool.tokenB.symbol} Amount`}
                token={selectedPool.tokenB}
                onTokenSelect={() => {}}
                amount={tokenBAmount}
                onAmountChange={() => {}}
                disabled
                balance="0.00"
              />

              <div className="bg-[#242424] rounded-xl p-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[#a0a0a0]">Pool Fee</span>
                  <span className="text-white">{selectedPool.fee}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#a0a0a0]">Share of Pool</span>
                  <span className="text-white">{estimatedShare}%</span>
                </div>
              </div>
            </>
          )}

          <Button fullWidth size="lg" disabled={isButtonDisabled} onClick={() => setShowConfirm(true)}>
            {getButtonText()}
          </Button>
        </div>
      </Card>

      {selectedPool && (
        <AddLiquidityConfirmModal
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleAddLiquidity}
          pool={selectedPool}
          tokenAAmount={tokenAAmount}
          tokenBAmount={tokenBAmount}
          sharePercent={estimatedShare}
          isLoading={isLoading}
        />
      )}
    </>
  );
}
