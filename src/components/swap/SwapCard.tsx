import { useState, useCallback } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import type { Token, SwapQuote } from '../../types';
import { Card, Button, TokenInput } from '../common';
import SwapSettings from './SwapSettings';
import SwapConfirmModal from './SwapConfirmModal';
import { DEFAULT_SLIPPAGE, TOKENS, getPoolByTokens } from '../../constants';
import { swap, getSwapQuote } from '../../services/contract';
import { isValidAmount } from '../../utils';

export default function SwapCard() {
  const account = useCurrentAccount();

  const [inputToken, setInputToken] = useState<Token | undefined>(TOKENS[0]);
  const [outputToken, setOutputToken] = useState<Token | undefined>(TOKENS[1]);
  const [inputAmount, setInputAmount] = useState('');
  const [slippage, setSlippage] = useState(DEFAULT_SLIPPAGE);
  const [showSettings, setShowSettings] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

  const handleSwitchTokens = () => {
    setInputToken(outputToken);
    setOutputToken(inputToken);
    setInputAmount('');
    setQuote(null);
  };

  const handleInputAmountChange = useCallback(
    async (amount: string) => {
      setInputAmount(amount);

      if (!inputToken || !outputToken || !isValidAmount(amount)) {
        setQuote(null);
        return;
      }

      const pool = getPoolByTokens(inputToken.address, outputToken.address);
      if (!pool) {
        setQuote(null);
        return;
      }

      setIsLoading(true);
      try {
        const newQuote = await getSwapQuote(inputToken, outputToken, amount, pool);
        setQuote(newQuote);
      } catch (error) {
        console.error('Failed to get quote:', error);
        setQuote(null);
      } finally {
        setIsLoading(false);
      }
    },
    [inputToken, outputToken]
  );

  const handleSwap = async () => {
    if (!inputToken || !outputToken || !quote) return;

    setIsSwapping(true);
    try {
      const minOutput = (parseFloat(quote.outputAmount) * (1 - slippage / 100)).toString();
      await swap({
        inputToken,
        outputToken,
        inputAmount,
        minOutputAmount: minOutput,
        slippage,
      });
      setInputAmount('');
      setQuote(null);
      setShowConfirm(false);
    } catch (error) {
      console.error('Swap failed:', error);
      alert('Swap failed. Please check console for details.');
    } finally {
      setIsSwapping(false);
    }
  };

  const isButtonDisabled =
    !account || !inputToken || !outputToken || !isValidAmount(inputAmount) || isLoading;

  const getButtonText = () => {
    if (!account) return 'Connect Wallet';
    if (!inputToken || !outputToken) return 'Select tokens';
    if (!isValidAmount(inputAmount)) return 'Enter amount';
    if (isLoading) return 'Getting quote...';
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

        <div className="space-y-2">
          <TokenInput
            label="You pay"
            token={inputToken}
            onTokenSelect={setInputToken}
            amount={inputAmount}
            onAmountChange={handleInputAmountChange}
            excludeToken={outputToken}
            balance="0.00"
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
            balance="0.00"
          />
        </div>

        {quote && inputToken && outputToken && (
          <div className="mt-4 p-3 bg-[#242424] rounded-xl text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[#a0a0a0]">Price</span>
              <span className="text-white">
                1 {inputToken.symbol} = {(parseFloat(quote.outputAmount) / parseFloat(inputAmount)).toFixed(4)}{' '}
                {outputToken.symbol}
              </span>
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
