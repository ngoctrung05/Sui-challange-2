import type { Token, SwapQuote } from '../../types';
import { Modal, Button } from '../common';
import { formatPercent } from '../../utils';

interface SwapConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  inputToken: Token;
  outputToken: Token;
  inputAmount: string;
  quote: SwapQuote | null;
  slippage: number;
  isLoading?: boolean;
}

export default function SwapConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  inputToken,
  outputToken,
  inputAmount,
  quote,
  slippage,
  isLoading = false,
}: SwapConfirmModalProps) {
  if (!quote) return null;

  const minReceived = (parseFloat(quote.outputAmount) * (1 - slippage / 100)).toFixed(6);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Swap">
      <div className="space-y-4">
        <div className="bg-[#242424] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[#a0a0a0]">You pay</span>
            <div className="flex items-center gap-2">
              {inputToken.logoUrl && (
                <img src={inputToken.logoUrl} alt={inputToken.symbol} className="w-5 h-5 rounded-full" />
              )}
              <span className="font-medium text-white">
                {inputAmount} {inputToken.symbol}
              </span>
            </div>
          </div>

          <div className="flex justify-center">
            <svg className="w-5 h-5 text-[#a0a0a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#a0a0a0]">You receive</span>
            <div className="flex items-center gap-2">
              {outputToken.logoUrl && (
                <img src={outputToken.logoUrl} alt={outputToken.symbol} className="w-5 h-5 rounded-full" />
              )}
              <span className="font-medium text-white">
                {quote.outputAmount} {outputToken.symbol}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[#a0a0a0]">Price Impact</span>
            <span className={quote.priceImpact > 3 ? 'text-red-500' : 'text-white'}>
              {formatPercent(quote.priceImpact)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#a0a0a0]">Minimum received</span>
            <span className="text-white">
              {minReceived} {outputToken.symbol}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#a0a0a0]">Slippage tolerance</span>
            <span className="text-white">{formatPercent(slippage)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#a0a0a0]">Fee</span>
            <span className="text-white">
              {quote.fee} {inputToken.symbol}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button fullWidth onClick={onConfirm} loading={isLoading}>
            Confirm Swap
          </Button>
        </div>
      </div>
    </Modal>
  );
}
