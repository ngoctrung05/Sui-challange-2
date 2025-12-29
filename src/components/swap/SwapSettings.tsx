import { useState } from 'react';
import { Modal, Button } from '../common';
import { SLIPPAGE_OPTIONS, MAX_SLIPPAGE } from '../../constants';

interface SwapSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  slippage: number;
  onSlippageChange: (slippage: number) => void;
}

export default function SwapSettings({ isOpen, onClose, slippage, onSlippageChange }: SwapSettingsProps) {
  const [customSlippage, setCustomSlippage] = useState('');
  const [error, setError] = useState('');

  const handleCustomChange = (value: string) => {
    setCustomSlippage(value);
    setError('');

    const num = parseFloat(value);
    if (value && !isNaN(num)) {
      if (num <= 0) {
        setError('Slippage must be greater than 0');
      } else if (num > MAX_SLIPPAGE) {
        setError(`Slippage cannot exceed ${MAX_SLIPPAGE}%`);
      } else {
        onSlippageChange(num);
      }
    }
  };

  const handlePresetClick = (value: number) => {
    setCustomSlippage('');
    setError('');
    onSlippageChange(value);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Swap Settings" size="sm">
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-[#a0a0a0] mb-3">Slippage Tolerance</label>
          <div className="flex gap-2 mb-3">
            {SLIPPAGE_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => handlePresetClick(option)}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  slippage === option && !customSlippage
                    ? 'bg-indigo-500 text-white'
                    : 'bg-[#242424] text-[#a0a0a0] hover:bg-[#333333]'
                }`}
              >
                {option}%
              </button>
            ))}
          </div>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              placeholder="Custom"
              value={customSlippage}
              onChange={(e) => handleCustomChange(e.target.value)}
              className={`w-full bg-[#242424] border rounded-xl px-4 py-3 text-white placeholder-[#666666] focus:outline-none transition-colors ${
                error ? 'border-red-500' : 'border-[#333333] focus:border-indigo-500'
              }`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a0a0a0]">%</span>
          </div>
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          {slippage > 5 && !error && (
            <p className="mt-2 text-sm text-yellow-500">High slippage may result in unfavorable trades</p>
          )}
        </div>

        <Button fullWidth onClick={onClose}>
          Save Settings
        </Button>
      </div>
    </Modal>
  );
}
