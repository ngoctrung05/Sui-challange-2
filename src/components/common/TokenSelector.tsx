import { useState } from 'react';
import type { Token } from '../../types';
import { TOKENS } from '../../constants';
import Modal from './Modal';

interface TokenSelectorProps {
  selectedToken?: Token;
  onSelect: (token: Token) => void;
  excludeToken?: Token;
  label?: string;
}

export default function TokenSelector({ selectedToken, onSelect, excludeToken, label }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredTokens = TOKENS.filter((token) => {
    if (excludeToken && token.address === excludeToken.address) return false;
    if (!search) return true;
    return (
      token.symbol.toLowerCase().includes(search.toLowerCase()) ||
      token.name.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleSelect = (token: Token) => {
    onSelect(token);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <>
      {label && <label className="block text-sm text-[#a0a0a0] mb-2">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-[#242424] hover:bg-[#333333] rounded-xl transition-colors"
      >
        {selectedToken ? (
          <>
            {selectedToken.logoUrl && (
              <img
                src={selectedToken.logoUrl}
                alt={selectedToken.symbol}
                className="w-6 h-6 rounded-full"
              />
            )}
            <span className="font-medium text-white">{selectedToken.symbol}</span>
          </>
        ) : (
          <span className="text-[#a0a0a0]">Select token</span>
        )}
        <svg className="w-4 h-4 text-[#a0a0a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Select a token">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by name or symbol"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#242424] border border-[#333333] rounded-xl px-4 py-3 text-white placeholder-[#666666] focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="space-y-1 max-h-80 overflow-y-auto">
          {filteredTokens.length === 0 ? (
            <p className="text-center text-[#a0a0a0] py-4">No tokens found</p>
          ) : (
            filteredTokens.map((token) => (
              <button
                key={token.address}
                onClick={() => handleSelect(token)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  selectedToken?.address === token.address
                    ? 'bg-indigo-500/20 border border-indigo-500'
                    : 'hover:bg-[#242424]'
                }`}
              >
                {token.logoUrl ? (
                  <img src={token.logoUrl} alt={token.symbol} className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#333333] flex items-center justify-center text-sm font-medium">
                    {token.symbol.slice(0, 2)}
                  </div>
                )}
                <div className="text-left">
                  <div className="font-medium text-white">{token.symbol}</div>
                  <div className="text-sm text-[#a0a0a0]">{token.name}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </Modal>
    </>
  );
}
