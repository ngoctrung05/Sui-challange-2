import type { Token } from '../../types';
import TokenSelector from './TokenSelector';
import { sanitizeNumericInput } from '../../utils';

interface TokenInputProps {
  token?: Token;
  onTokenSelect: (token: Token) => void;
  amount: string;
  onAmountChange: (amount: string) => void;
  balance?: string;
  balanceLabel?: string;
  onMaxClick?: () => void;
  excludeToken?: Token;
  disabled?: boolean;
  label?: string;
  showUsdValue?: boolean;
  usdValue?: string;
}

export default function TokenInput({
  token,
  onTokenSelect,
  amount,
  onAmountChange,
  balance,
  balanceLabel = 'Balance',
  onMaxClick,
  excludeToken,
  disabled = false,
  label,
  showUsdValue = false,
  usdValue,
}: TokenInputProps) {
  const handleAmountChange = (value: string) => {
    const sanitized = sanitizeNumericInput(value);
    onAmountChange(sanitized);
  };

  return (
    <div className="bg-[#242424] rounded-2xl p-4">
      {label && <div className="text-sm text-[#a0a0a0] mb-2">{label}</div>}

      <div className="flex items-center gap-3">
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.0"
          value={amount}
          onChange={(e) => handleAmountChange(e.target.value)}
          disabled={disabled}
          className="flex-1 bg-transparent text-2xl font-medium text-white placeholder-[#666666] focus:outline-none disabled:opacity-50"
        />
        <TokenSelector selectedToken={token} onSelect={onTokenSelect} excludeToken={excludeToken} />
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="text-sm text-[#a0a0a0]">
          {showUsdValue && usdValue ? `~$${usdValue}` : '\u00A0'}
        </div>
        {balance !== undefined && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#a0a0a0]">
              {balanceLabel}: {balance}
            </span>
            {onMaxClick && (
              <button
                type="button"
                onClick={onMaxClick}
                className="text-indigo-400 hover:text-indigo-300 font-medium uppercase text-xs"
              >
                Max
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
