import { useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import type { Token } from '../../types';
import { Card, Button } from '../common';
import { FAUCET_TOKENS } from '../../constants';
import { requestFaucet } from '../../services/contract';

export default function FaucetCard() {
  const account = useCurrentAccount();
  const [loadingToken, setLoadingToken] = useState<string | null>(null);
  const [successToken, setSuccessToken] = useState<string | null>(null);

  const handleFaucetRequest = async (token: Token) => {
    if (!account) return;

    setLoadingToken(token.symbol);
    setSuccessToken(null);

    try {
      const result = await requestFaucet({
        token,
        recipient: account.address,
      });

      if (result.success) {
        setSuccessToken(token.symbol);
        setTimeout(() => setSuccessToken(null), 3000);
      }
    } catch (error) {
      console.error('Faucet request failed:', error);
      alert(`Failed to request ${token.symbol}. Please try again.`);
    } finally {
      setLoadingToken(null);
    }
  };

  if (!account) {
    return (
      <Card className="max-w-md mx-auto text-center py-12">
        <svg
          className="w-16 h-16 mx-auto mb-4 text-[#333333]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-white mb-2">Connect Wallet</h3>
        <p className="text-[#a0a0a0]">Connect your wallet to request test tokens</p>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-500/20 rounded-xl">
          <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Faucet</h2>
          <p className="text-sm text-[#a0a0a0]">Get test tokens for development</p>
        </div>
      </div>

      <div className="space-y-3">
        {FAUCET_TOKENS.map((token) => (
          <div
            key={token.symbol}
            className="flex items-center justify-between p-4 bg-[#242424] rounded-xl"
          >
            <div className="flex items-center gap-3">
              {token.logoUrl ? (
                <img src={token.logoUrl} alt={token.symbol} className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#333333] flex items-center justify-center text-sm font-medium">
                  {token.symbol.slice(0, 2)}
                </div>
              )}
              <div>
                <p className="font-medium text-white">{token.symbol}</p>
                <p className="text-sm text-[#a0a0a0]">{token.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-[#a0a0a0]">{token.faucetAmount} tokens</span>
              <Button
                size="sm"
                variant={successToken === token.symbol ? 'secondary' : 'primary'}
                loading={loadingToken === token.symbol}
                disabled={loadingToken !== null}
                onClick={() => handleFaucetRequest(token)}
              >
                {successToken === token.symbol ? (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Sent
                  </span>
                ) : (
                  'Request'
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-[#242424] rounded-xl">
        <p className="text-xs text-[#a0a0a0] text-center">
          Testnet faucet tokens are for development purposes only and have no real value.
        </p>
      </div>
    </Card>
  );
}
