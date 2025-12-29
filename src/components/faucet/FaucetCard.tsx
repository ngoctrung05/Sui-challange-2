import { useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import type { Token } from '../../types';
import { Card, Button } from '../common';
import { FAUCET_TOKENS } from '../../constants';
import { buildFaucetTransaction } from '../../services/contract';
import { useToast } from '../../contexts/ToastContext';

export default function FaucetCard() {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const { showTxSuccess, showError } = useToast();
  const [loadingToken, setLoadingToken] = useState<string | null>(null);
  const [successToken, setSuccessToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFaucetRequest = async (token: Token) => {
    if (!account) return;

    setLoadingToken(token.symbol);
    setSuccessToken(null);
    setError(null);

    try {
      const tx = buildFaucetTransaction({
        token,
        recipient: account.address,
      });

      const result = await signAndExecute({
        transaction: tx,
      });

      console.log('Faucet transaction result:', result);
      setSuccessToken(token.symbol);
      setTimeout(() => setSuccessToken(null), 5000);

      // Show toast with SuiVision link
      showTxSuccess(
        `${token.symbol} Received`,
        result.digest,
        `Successfully received ${token.faucetAmount} ${token.symbol} tokens`
      );
    } catch (err) {
      console.error('Faucet request failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      // Check for cooldown error
      if (errorMessage.includes('200') || errorMessage.includes('cooldown')) {
        const cooldownMsg = `Please wait before requesting ${token.symbol} again (1 hour cooldown)`;
        setError(cooldownMsg);
        showError('Cooldown Active', cooldownMsg);
      } else {
        setError(`Failed to request ${token.symbol}: ${errorMessage}`);
        showError('Faucet Request Failed', errorMessage);
      }
      setTimeout(() => setError(null), 5000);
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

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

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
          <br />
          <span className="text-[#666666]">Cooldown: 1 hour between requests per token</span>
        </p>
      </div>
    </Card>
  );
}
