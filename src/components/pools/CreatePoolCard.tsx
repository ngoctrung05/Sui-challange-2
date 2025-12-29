import { useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import type { Token } from '../../types';
import { Card, Button, TokenSelector } from '../common';
import { DEX_PACKAGE_ID, REGISTRY_ID, TOKENS } from '../../constants';
import { useToast } from '../../contexts/ToastContext';

export default function CreatePoolCard() {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const { showTxSuccess, showError } = useToast();

  const [tokenX, setTokenX] = useState<Token | undefined>();
  const [tokenY, setTokenY] = useState<Token | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCreatePool = async () => {
    if (!account || !tokenX || !tokenY) return;

    if (tokenX.address === tokenY.address) {
      setError('Cannot create a pool with the same token');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const tx = new Transaction();

      // Create the pool
      const [pool, adminCap] = tx.moveCall({
        target: `${DEX_PACKAGE_ID}::pool::create_pool`,
        typeArguments: [tokenX.address, tokenY.address],
        arguments: [],
      });

      // Register pool in registry
      tx.moveCall({
        target: `${DEX_PACKAGE_ID}::registry::register_pool`,
        typeArguments: [tokenX.address, tokenY.address],
        arguments: [
          tx.object(REGISTRY_ID),
          tx.moveCall({
            target: `${DEX_PACKAGE_ID}::pool::get_pool_id`,
            typeArguments: [tokenX.address, tokenY.address],
            arguments: [pool],
          }),
        ],
      });

      // Share the pool object
      tx.moveCall({
        target: '0x2::transfer::public_share_object',
        typeArguments: [`${DEX_PACKAGE_ID}::pool::Pool<${tokenX.address}, ${tokenY.address}>`],
        arguments: [pool],
      });

      // Transfer admin cap to sender
      tx.transferObjects([adminCap], account.address);

      const result = await signAndExecute({
        transaction: tx,
      });

      console.log('Create pool result:', result);
      setSuccess(`Pool ${tokenX.symbol}/${tokenY.symbol} created successfully!`);

      // Show toast with SuiVision link
      showTxSuccess(
        'Pool Created',
        result.digest,
        `Created ${tokenX.symbol}/${tokenY.symbol} liquidity pool`
      );

      setTokenX(undefined);
      setTokenY(undefined);

      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Create pool failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      if (errorMessage.includes('100') || errorMessage.includes('POOL_ALREADY_EXISTS')) {
        const existsMsg = 'A pool for this token pair already exists';
        setError(existsMsg);
        showError('Pool Creation Failed', existsMsg);
      } else {
        setError(`Failed to create pool: ${errorMessage}`);
        showError('Pool Creation Failed', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonDisabled = !account || !tokenX || !tokenY || tokenX.address === tokenY.address;

  const getButtonText = () => {
    if (!account) return 'Connect Wallet';
    if (!tokenX || !tokenY) return 'Select Tokens';
    if (tokenX.address === tokenY.address) return 'Select Different Tokens';
    return 'Create Pool';
  };

  return (
    <Card className="max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-500/20 rounded-xl">
          <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Create New Pool</h2>
          <p className="text-sm text-[#a0a0a0]">Create a liquidity pool for a token pair</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
          <p className="text-sm text-green-400">{success}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-[#a0a0a0] mb-2">Token X</label>
          <TokenSelector
            selectedToken={tokenX}
            onSelect={setTokenX}
            tokens={TOKENS.filter((t) => t.address !== tokenY?.address)}
          />
        </div>

        <div className="flex justify-center">
          <div className="p-2 bg-[#242424] rounded-full">
            <svg className="w-5 h-5 text-[#a0a0a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0 0l-4-4m4 4l4-4" />
            </svg>
          </div>
        </div>

        <div>
          <label className="block text-sm text-[#a0a0a0] mb-2">Token Y</label>
          <TokenSelector
            selectedToken={tokenY}
            onSelect={setTokenY}
            tokens={TOKENS.filter((t) => t.address !== tokenX?.address)}
          />
        </div>

        {tokenX && tokenY && tokenX.address !== tokenY.address && (
          <div className="bg-[#242424] rounded-xl p-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[#a0a0a0]">Pool Pair</span>
              <span className="text-white">{tokenX.symbol} / {tokenY.symbol}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#a0a0a0]">Trading Fee</span>
              <span className="text-white">0.3%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#a0a0a0]">Initial Liquidity</span>
              <span className="text-white">0 (add after creation)</span>
            </div>
          </div>
        )}

        <Button
          fullWidth
          size="lg"
          disabled={isButtonDisabled}
          loading={isLoading}
          onClick={handleCreatePool}
        >
          {getButtonText()}
        </Button>
      </div>

      <div className="mt-4 p-3 bg-[#242424] rounded-xl">
        <p className="text-xs text-[#a0a0a0] text-center">
          Creating a pool makes you the pool admin. After creation, add initial liquidity to enable trading.
        </p>
      </div>
    </Card>
  );
}
