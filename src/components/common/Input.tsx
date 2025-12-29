import type { InputHTMLAttributes } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  onValueChange?: (value: string) => void;
  showMaxButton?: boolean;
  onMaxClick?: () => void;
  suffix?: string;
}

export default function Input({
  label,
  error,
  onValueChange,
  showMaxButton = false,
  onMaxClick,
  suffix,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm text-[#a0a0a0] mb-2">{label}</label>}
      <div className="relative">
        <input
          className={`w-full bg-[#1a1a1a] border border-[#333333] rounded-xl px-4 py-3 text-white placeholder-[#666666] focus:outline-none focus:border-indigo-500 transition-colors ${error ? 'border-red-500' : ''} ${suffix || showMaxButton ? 'pr-20' : ''} ${className}`}
          onChange={(e) => onValueChange?.(e.target.value)}
          {...props}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {showMaxButton && (
            <button
              type="button"
              onClick={onMaxClick}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium uppercase"
            >
              Max
            </button>
          )}
          {suffix && <span className="text-[#a0a0a0] text-sm">{suffix}</span>}
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
