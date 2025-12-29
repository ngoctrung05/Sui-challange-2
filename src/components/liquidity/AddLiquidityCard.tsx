import { useState, useEffect, useMemo } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import type { Pool } from '../../types';
import { Card, Button, TokenInput } from '../common';
import PoolSelector from './PoolSelector';
import { AddLiquidityConfirmModal } from './LiquidityConfirmModal';
import { DEX_PACKAGE_ID } from '../../constants';
import { isValidAmount } from '../../utils';
import { useTokenBalance } from '../../hooks';
import { useToast } from '../../contexts/ToastContext';

export default function AddLiquidityCard() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const { showTxSuccess, showError } = useToast();

  const [selectedPool, setSelectedPool] = useState<Pool | undefined>();
  const [tokenAAmount, setTokenAAmount] = useState('');
  const [tokenBAmount, setTokenBAmount] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: tokenABalance } = useTokenBalance(selectedPool?.tokenA);
  const { data: tokenBBalance } = useTokenBalance(selectedPool?.tokenB);

  // Check if this is initial liquidity (empty pool)
  const isInitialLiquidity = useMemo(() => {
    if (!selectedPool) return false;
    const reserveA = BigInt(selectedPool.reserveA || '0');
    const reserveB = BigInt(selectedPool.reserveB || '0');
    return reserveA === BigInt(0) && reserveB === BigInt(0);
  }, [selectedPool]);

  // Auto-calculate tokenB for subsequent liquidity (when pool has reserves)
  useEffect(() => {
    // Skip auto-calculation for initial liquidity - user sets both amounts
    if (isInitialLiquidity) return;

    if (!selectedPool || !tokenAAmount) {
      setTokenBAmount('');
      return;
    }

    const reserveA = parseFloat(selectedPool.reserveA);
    const reserveB = parseFloat(selectedPool.reserveB);

    if (reserveA > 0 && reserveB > 0) {
      // Formula: amount_y = amount_x * (reserve_y / reserve_x)
      const ratio = reserveB / reserveA;
      const calculatedB = (parseFloat(tokenAAmount) * ratio).toFixed(6);
      setTokenBAmount(calculatedB);
    }
  }, [tokenAAmount, selectedPool, isInitialLiquidity]);

  const handlePoolSelect = (pool: Pool) => {
    setSelectedPool(pool);
    setTokenAAmount('');
    setTokenBAmount('');
    setError(null);
  };

  // Validate Sui object ID format
  const isValidPoolId = (id: string): boolean => {
    return typeof id === 'string' && /^0x[a-fA-F0-9]{64}$/.test(id);
  };

  const handleAddLiquidity = async () => {
    if (!selectedPool || !account) return;

    // Validate pool ID before proceeding
    if (!isValidPoolId(selectedPool.id)) {
      const errMsg = `Invalid pool ID: ${selectedPool.id}`;
      console.error(errMsg);
      setError('No valid liquidity pool selected. Please create a pool first.');
      showError('Add Liquidity Failed', 'Invalid pool ID');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const tx = new Transaction();

      const amountARaw = BigInt(
        Math.floor(parseFloat(tokenAAmount) * Math.pow(10, selectedPool.tokenA.decimals))
      );
      const amountBRaw = BigInt(
        Math.floor(parseFloat(tokenBAmount) * Math.pow(10, selectedPool.tokenB.decimals))
      );

      // Get or create coin for token A
      let coinA;
      if (selectedPool.tokenA.address === '0x2::sui::SUI') {
        [coinA] = tx.splitCoins(tx.gas, [tx.pure.u64(amountARaw)]);
      } else {
        const coinsA = await client.getCoins({
          owner: account.address,
          coinType: selectedPool.tokenA.address,
        });

        if (coinsA.data.length === 0) {
          throw new Error(`No ${selectedPool.tokenA.symbol} coins found`);
        }

        if (coinsA.data.length > 1) {
          const primaryCoin = tx.object(coinsA.data[0].coinObjectId);
          tx.mergeCoins(primaryCoin, coinsA.data.slice(1).map((c) => tx.object(c.coinObjectId)));
          [coinA] = tx.splitCoins(primaryCoin, [tx.pure.u64(amountARaw)]);
        } else {
          [coinA] = tx.splitCoins(tx.object(coinsA.data[0].coinObjectId), [tx.pure.u64(amountARaw)]);
        }
      }

      // Get or create coin for token B
      let coinB;
      if (selectedPool.tokenB.address === '0x2::sui::SUI') {
        [coinB] = tx.splitCoins(tx.gas, [tx.pure.u64(amountBRaw)]);
      } else {
        const coinsB = await client.getCoins({
          owner: account.address,
          coinType: selectedPool.tokenB.address,
        });

        if (coinsB.data.length === 0) {
          throw new Error(`No ${selectedPool.tokenB.symbol} coins found`);
        }

        if (coinsB.data.length > 1) {
          const primaryCoin = tx.object(coinsB.data[0].coinObjectId);
          tx.mergeCoins(primaryCoin, coinsB.data.slice(1).map((c) => tx.object(c.coinObjectId)));
          [coinB] = tx.splitCoins(primaryCoin, [tx.pure.u64(amountBRaw)]);
        } else {
          [coinB] = tx.splitCoins(tx.object(coinsB.data[0].coinObjectId), [tx.pure.u64(amountBRaw)]);
        }
      }

      // Add liquidity
      const [lpCoin] = tx.moveCall({
        target: `${DEX_PACKAGE_ID}::liquidity::add_liquidity`,
        typeArguments: [selectedPool.tokenA.address, selectedPool.tokenB.address],
        arguments: [
          tx.object(selectedPool.id),
          coinA,
          coinB,
        ],
      });

      // Transfer LP tokens to sender
      tx.transferObjects([lpCoin], account.address);

      const result = await signAndExecute({
        transaction: tx,
      });

      console.log('Add liquidity result:', result);

      // Show toast with SuiVision link
      showTxSuccess(
        'Liquidity Added',
        result.digest,
        `Added ${tokenAAmount} ${selectedPool.tokenA.symbol} + ${tokenBAmount} ${selectedPool.tokenB.symbol}`
      );

      setTokenAAmount('');
      setTokenBAmount('');
      setShowConfirm(false);
    } catch (err) {
      console.error('Add liquidity failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to add liquidity: ${errorMessage}`);
      showError('Add Liquidity Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate estimated share of pool
  const estimatedShare = useMemo(() => {
    if (!selectedPool || !isValidAmount(tokenAAmount)) return '0';

    if (isInitialLiquidity) {
      // For initial liquidity, you get 100% of the pool (minus minimum liquidity)
      return '100.0000';
    }

    const reserveA = parseFloat(selectedPool.reserveA);
    const amountA = parseFloat(tokenAAmount);
    if (reserveA === 0) return '100.0000';

    return ((amountA / (reserveA + amountA)) * 100).toFixed(4);
  }, [selectedPool, tokenAAmount, isInitialLiquidity]);

  // For initial liquidity, both amounts are required
  // For subsequent liquidity, only tokenA is required (tokenB is auto-calculated)
  const isButtonDisabled = !account || !selectedPool || !isValidAmount(tokenAAmount) ||
    (isInitialLiquidity && !isValidAmount(tokenBAmount));

  const getButtonText = () => {
    if (!account) return 'Connect Wallet';
    if (!selectedPool) return 'Select a pool';
    if (!isValidAmount(tokenAAmount)) return 'Enter amount';
    if (isInitialLiquidity && !isValidAmount(tokenBAmount)) return 'Enter both amounts';
    return 'Add Liquidity';
  };

  return (
    <>
      <Card className="max-w-md mx-auto">
        <h2 className="text-xl font-semibold text-white mb-4">Add Liquidity</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

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
                balance={tokenABalance?.formatted || '0.00'}
              />

              <TokenInput
                label={`${selectedPool.tokenB.symbol} Amount${isInitialLiquidity ? '' : ' (calculated)'}`}
                token={selectedPool.tokenB}
                onTokenSelect={() => {}}
                amount={tokenBAmount}
                onAmountChange={isInitialLiquidity ? setTokenBAmount : () => {}}
                disabled={!isInitialLiquidity}
                balance={tokenBBalance?.formatted || '0.00'}
              />

              {isInitialLiquidity && (
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                  <p className="text-sm text-indigo-400">
                    This is initial liquidity. You can set any ratio between the two tokens.
                    This ratio will determine the initial price of the pool.
                  </p>
                </div>
              )}

              <div className="bg-[#242424] rounded-xl p-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[#a0a0a0]">Pool Fee</span>
                  <span className="text-white">{selectedPool.fee}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#a0a0a0]">Share of Pool</span>
                  <span className="text-white">{estimatedShare}%</span>
                </div>
                {isInitialLiquidity && isValidAmount(tokenAAmount) && isValidAmount(tokenBAmount) && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#a0a0a0]">Initial Price</span>
                    <span className="text-white">
                      1 {selectedPool.tokenA.symbol} = {(parseFloat(tokenBAmount) / parseFloat(tokenAAmount)).toFixed(6)} {selectedPool.tokenB.symbol}
                    </span>
                  </div>
                )}
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
