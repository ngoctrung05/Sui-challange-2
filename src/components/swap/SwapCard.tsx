import { useState, useCallback, useEffect, useMemo } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import type { Token, SwapQuote } from '../../types';
import { Card, Button, TokenInput } from '../common';
import SwapSettings from './SwapSettings';
import SwapConfirmModal from './SwapConfirmModal';
import { DEFAULT_SLIPPAGE, TOKENS, DEX_PACKAGE_ID, FEE_DENOMINATOR } from '../../constants';
import { calculateSwapOutput, calculatePriceImpact } from '../../services/contract';
import { isValidAmount } from '../../utils';
import { useTokenBalance, usePoolsFromRegistry } from '../../hooks';
import { useToast } from '../../contexts/ToastContext';
import type { PoolData } from '../../hooks/usePoolsFromRegistry';

/**
 * Validate that a string is a valid Sui object ID (64 hex chars after 0x)
 */
const isValidSuiObjectId = (id: string): boolean => {
  if (!id || typeof id !== 'string') return false;
  // Must start with 0x and have valid hex characters
  const hexPattern = /^0x[a-fA-F0-9]{64}$/;
  return hexPattern.test(id);
};

/**
 * Find pool for a token pair from registry pools
 * Only returns pools with valid Sui object IDs
 */
const findPoolForPair = (
  pools: PoolData[] | undefined,
  tokenA: Token | undefined,
  tokenB: Token | undefined
): PoolData | null => {
  if (!pools || !tokenA || !tokenB) return null;

  const pool = pools.find((pool) => {
    const matchAB = pool.typeX === tokenA.address && pool.typeY === tokenB.address;
    const matchBA = pool.typeX === tokenB.address && pool.typeY === tokenA.address;
    return matchAB || matchBA;
  });

  // Validate pool ID before returning
  if (pool && !isValidSuiObjectId(pool.id)) {
    console.error('Invalid pool ID found:', pool.id);
    return null;
  }

  return pool || null;
};

/**
 * Calculate swap quote from pool data
 */
const getSwapQuoteFromPool = (
  inputToken: Token,
  outputToken: Token,
  inputAmount: string,
  pool: PoolData
): SwapQuote => {
  const inputDecimals = inputToken.decimals;
  const outputDecimals = outputToken.decimals;

  const amountInRaw = parseFloat(inputAmount) * Math.pow(10, inputDecimals);

  // Determine which reserves to use based on swap direction
  const isXToY = pool.typeX === inputToken.address;
  const reserveIn = parseFloat(isXToY ? pool.reserveX : pool.reserveY);
  const reserveOut = parseFloat(isXToY ? pool.reserveY : pool.reserveX);

  const amountOutRaw = calculateSwapOutput(amountInRaw, reserveIn, reserveOut, pool.feeBps);
  const amountOut = amountOutRaw / Math.pow(10, outputDecimals);

  const priceImpact = calculatePriceImpact(amountInRaw, amountOutRaw, reserveIn, reserveOut);

  const feeAmount = parseFloat(inputAmount) * (pool.feeBps / FEE_DENOMINATOR);

  return {
    inputToken,
    outputToken,
    inputAmount,
    outputAmount: amountOut.toFixed(outputDecimals),
    priceImpact,
    fee: feeAmount.toFixed(inputDecimals),
    route: [inputToken.symbol, outputToken.symbol],
  };
};

export default function SwapCard() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const { showTxSuccess, showError } = useToast();
  const { data: pools, isLoading: poolsLoading } = usePoolsFromRegistry();

  const [inputToken, setInputToken] = useState<Token | undefined>(TOKENS[0]);
  const [outputToken, setOutputToken] = useState<Token | undefined>(TOKENS[1]);
  const [inputAmount, setInputAmount] = useState('');
  const [slippage, setSlippage] = useState(DEFAULT_SLIPPAGE);
  const [showSettings, setShowSettings] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: inputBalance } = useTokenBalance(inputToken);
  const { data: outputBalance } = useTokenBalance(outputToken);

  // Find pool for current token pair
  const currentPool = useMemo(() => {
    return findPoolForPair(pools, inputToken, outputToken);
  }, [pools, inputToken, outputToken]);

  const handleSwitchTokens = () => {
    setInputToken(outputToken);
    setOutputToken(inputToken);
    setInputAmount('');
    setQuote(null);
  };

  const handleInputAmountChange = useCallback(
    async (amount: string) => {
      setInputAmount(amount);
      setError(null);

      if (!inputToken || !outputToken || !isValidAmount(amount)) {
        setQuote(null);
        return;
      }

      if (poolsLoading) {
        setIsLoading(true);
        return;
      }

      const pool = findPoolForPair(pools, inputToken, outputToken);
      if (!pool) {
        setError('No liquidity pool available for this pair');
        setQuote(null);
        return;
      }

      setIsLoading(true);
      try {
        const newQuote = getSwapQuoteFromPool(inputToken, outputToken, amount, pool);
        setQuote(newQuote);
      } catch (err) {
        console.error('Failed to get quote:', err);
        setQuote(null);
      } finally {
        setIsLoading(false);
      }
    },
    [inputToken, outputToken, pools, poolsLoading]
  );

  // Recalculate quote when tokens or pools change
  useEffect(() => {
    if (inputAmount && inputToken && outputToken && !poolsLoading) {
      handleInputAmountChange(inputAmount);
    }
  }, [inputToken, outputToken, pools, poolsLoading]);

  const handleSwap = async () => {
    if (!inputToken || !outputToken || !quote || !account || !currentPool) return;

    // Validate pool ID before proceeding
    if (!isValidSuiObjectId(currentPool.id)) {
      const errMsg = `Invalid pool ID: ${currentPool.id}. Please ensure a valid pool exists for this pair.`;
      console.error(errMsg);
      setError(errMsg);
      showError('Swap Failed', 'No valid liquidity pool found for this token pair');
      return;
    }

    setIsSwapping(true);
    setError(null);

    console.log('Executing swap with pool:', {
      poolId: currentPool.id,
      typeX: currentPool.typeX,
      typeY: currentPool.typeY,
      reserveX: currentPool.reserveX,
      reserveY: currentPool.reserveY,
    });

    try {
      const tx = new Transaction();

      // Calculate amounts in base units
      const inputAmountRaw = BigInt(
        Math.floor(parseFloat(inputAmount) * Math.pow(10, inputToken.decimals))
      );
      const minOutputRaw = BigInt(
        Math.floor(parseFloat(quote.outputAmount) * (1 - slippage / 100) * Math.pow(10, outputToken.decimals))
      );

      // Get coins and merge/split as needed
      let coinToSwap;

      if (inputToken.address === '0x2::sui::SUI') {
        // For SUI, split from gas
        const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(inputAmountRaw)]);
        coinToSwap = coin;
      } else {
        // For other tokens, get coins from wallet
        const coins = await client.getCoins({
          owner: account.address,
          coinType: inputToken.address,
        });

        if (coins.data.length === 0) {
          throw new Error(`No ${inputToken.symbol} coins found in wallet`);
        }

        // Calculate total balance
        const totalBalance = coins.data.reduce(
          (sum, coin) => sum + BigInt(coin.balance),
          BigInt(0)
        );

        if (totalBalance < inputAmountRaw) {
          throw new Error(`Insufficient ${inputToken.symbol} balance`);
        }

        // If we have multiple coins, merge them first
        if (coins.data.length > 1) {
          const primaryCoin = tx.object(coins.data[0].coinObjectId);
          const coinsToMerge = coins.data.slice(1).map((c) => tx.object(c.coinObjectId));
          tx.mergeCoins(primaryCoin, coinsToMerge);
          const [splitCoin] = tx.splitCoins(primaryCoin, [tx.pure.u64(inputAmountRaw)]);
          coinToSwap = splitCoin;
        } else if (BigInt(coins.data[0].balance) > inputAmountRaw) {
          // Single coin, but need to split exact amount
          const [splitCoin] = tx.splitCoins(tx.object(coins.data[0].coinObjectId), [
            tx.pure.u64(inputAmountRaw),
          ]);
          coinToSwap = splitCoin;
        } else {
          // Single coin with exact amount
          coinToSwap = tx.object(coins.data[0].coinObjectId);
        }
      }

      // Determine swap direction based on pool type order
      const isXToY = currentPool.typeX === inputToken.address;
      const swapFunction = isXToY ? 'swap_x_to_y' : 'swap_y_to_x';
      // Type arguments must match pool's type order (X, Y)
      const typeArgs = [currentPool.typeX, currentPool.typeY];

      // Execute swap with real pool ID
      const [outputCoin] = tx.moveCall({
        target: `${DEX_PACKAGE_ID}::swap::${swapFunction}`,
        typeArguments: typeArgs,
        arguments: [
          tx.object(currentPool.id),
          coinToSwap,
          tx.pure.u64(minOutputRaw),
        ],
      });

      // Transfer output to sender
      tx.transferObjects([outputCoin], account.address);

      const result = await signAndExecute({
        transaction: tx,
      });

      console.log('Swap transaction result:', result);

      // Show toast with SuiVision link
      showTxSuccess(
        'Swap Successful',
        result.digest,
        `Swapped ${inputAmount} ${inputToken.symbol} for ${quote.outputAmount} ${outputToken.symbol}`
      );

      // Reset form on success
      setInputAmount('');
      setQuote(null);
      setShowConfirm(false);
    } catch (err) {
      console.error('Swap failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      if (errorMessage.includes('E_SLIPPAGE_EXCEEDED') || errorMessage.includes('2')) {
        const slippageMsg = 'Slippage exceeded. Try increasing slippage tolerance.';
        setError(slippageMsg);
        showError('Swap Failed', slippageMsg);
      } else if (errorMessage.includes('Insufficient')) {
        setError(errorMessage);
        showError('Swap Failed', errorMessage);
      } else {
        setError(`Swap failed: ${errorMessage}`);
        showError('Swap Failed', errorMessage);
      }
    } finally {
      setIsSwapping(false);
    }
  };

  const isButtonDisabled =
    !account || !inputToken || !outputToken || !isValidAmount(inputAmount) || isLoading || !quote || !currentPool;

  const getButtonText = () => {
    if (!account) return 'Connect Wallet';
    if (!inputToken || !outputToken) return 'Select tokens';
    if (!isValidAmount(inputAmount)) return 'Enter amount';
    if (poolsLoading) return 'Loading pools...';
    if (isLoading) return 'Getting quote...';
    if (!currentPool) return 'No liquidity pool found';
    if (!quote) return 'No route found';
    return 'Swap';
  };

  return (
    <>
      <Card className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Swap</h2>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-[#a0a0a0] hover:text-white hover:bg-[#242424] rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <TokenInput
            label="You pay"
            token={inputToken}
            onTokenSelect={setInputToken}
            amount={inputAmount}
            onAmountChange={handleInputAmountChange}
            excludeToken={outputToken}
            balance={inputBalance?.formatted || '0.00'}
          />

          <div className="flex justify-center -my-1 relative z-10">
            <button
              onClick={handleSwitchTokens}
              className="p-2 bg-[#1a1a1a] border border-[#333333] rounded-xl hover:bg-[#242424] transition-colors"
            >
              <svg className="w-5 h-5 text-[#a0a0a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
            </button>
          </div>

          <TokenInput
            label="You receive"
            token={outputToken}
            onTokenSelect={setOutputToken}
            amount={quote?.outputAmount || ''}
            onAmountChange={() => {}}
            excludeToken={inputToken}
            disabled
            balance={outputBalance?.formatted || '0.00'}
          />
        </div>

        {quote && inputToken && outputToken && (
          <div className="mt-4 p-3 bg-[#242424] rounded-xl text-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#a0a0a0]">Price</span>
              <span className="text-white">
                1 {inputToken.symbol} = {(parseFloat(quote.outputAmount) / parseFloat(inputAmount)).toFixed(6)}{' '}
                {outputToken.symbol}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#a0a0a0]">Price Impact</span>
              <span className={quote.priceImpact > 5 ? 'text-red-400' : 'text-white'}>
                {quote.priceImpact.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#a0a0a0]">Fee (0.3%)</span>
              <span className="text-white">{quote.fee} {inputToken.symbol}</span>
            </div>
          </div>
        )}

        <Button
          fullWidth
          size="lg"
          className="mt-4"
          disabled={isButtonDisabled}
          onClick={() => setShowConfirm(true)}
        >
          {getButtonText()}
        </Button>
      </Card>

      <SwapSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        slippage={slippage}
        onSlippageChange={setSlippage}
      />

      {inputToken && outputToken && (
        <SwapConfirmModal
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleSwap}
          inputToken={inputToken}
          outputToken={outputToken}
          inputAmount={inputAmount}
          quote={quote}
          slippage={slippage}
          isLoading={isSwapping}
        />
      )}
    </>
  );
}
