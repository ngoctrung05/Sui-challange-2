import { useQuery } from '@tanstack/react-query';
import type { Token, SwapQuote } from '../types';
import { getPoolByTokens } from '../constants';

const SWAP_FEE = 0.003; // 0.3%

function calculateOutputAmount(
  inputAmount: string,
  reserveIn: string,
  reserveOut: string
): string {
  const amountIn = parseFloat(inputAmount);
  const resIn = parseFloat(reserveIn);
  const resOut = parseFloat(reserveOut);

  if (amountIn <= 0 || resIn <= 0 || resOut <= 0) return '0';

  // Constant product formula: (x + dx) * (y - dy) = x * y
  // With fee: dy = y * dx * (1 - fee) / (x + dx * (1 - fee))
  const amountInWithFee = amountIn * (1 - SWAP_FEE);
  const outputAmount = (resOut * amountInWithFee) / (resIn + amountInWithFee);

  return outputAmount.toFixed(8);
}

function calculatePriceImpact(
  inputAmount: string,
  outputAmount: string,
  reserveIn: string,
  reserveOut: string
): number {
  const resIn = parseFloat(reserveIn);
  const resOut = parseFloat(reserveOut);
  const spotPrice = resOut / resIn;

  const actualPrice = parseFloat(outputAmount) / parseFloat(inputAmount);
  const impact = ((spotPrice - actualPrice) / spotPrice) * 100;

  return Math.max(0, impact);
}

export function useSwapQuote(
  inputToken?: Token,
  outputToken?: Token,
  inputAmount?: string
) {
  return useQuery({
    queryKey: ['swapQuote', inputToken?.address, outputToken?.address, inputAmount],
    queryFn: async (): Promise<SwapQuote | null> => {
      if (!inputToken || !outputToken || !inputAmount || parseFloat(inputAmount) <= 0) {
        return null;
      }

      const pool = getPoolByTokens(inputToken.address, outputToken.address);
      if (!pool) return null;

      // Determine which token is which in the pool
      const isTokenAInput = pool.tokenA.address === inputToken.address;
      const reserveIn = isTokenAInput ? pool.reserveA : pool.reserveB;
      const reserveOut = isTokenAInput ? pool.reserveB : pool.reserveA;

      // Scale input amount to token decimals
      const scaledInput = (parseFloat(inputAmount) * Math.pow(10, inputToken.decimals)).toString();

      const outputAmount = calculateOutputAmount(scaledInput, reserveIn, reserveOut);

      // Scale output back to display decimals
      const displayOutput = (parseFloat(outputAmount) / Math.pow(10, outputToken.decimals)).toFixed(6);

      const priceImpact = calculatePriceImpact(scaledInput, outputAmount, reserveIn, reserveOut);
      const fee = (parseFloat(inputAmount) * SWAP_FEE).toFixed(6);

      return {
        inputToken,
        outputToken,
        inputAmount,
        outputAmount: displayOutput,
        priceImpact,
        fee,
        route: [inputToken.symbol, outputToken.symbol],
      };
    },
    enabled: !!inputToken && !!outputToken && !!inputAmount && parseFloat(inputAmount) > 0,
    refetchInterval: 5000,
    staleTime: 2000,
  });
}

export function useSwapRate(tokenA?: Token, tokenB?: Token) {
  return useQuery({
    queryKey: ['swapRate', tokenA?.address, tokenB?.address],
    queryFn: async () => {
      if (!tokenA || !tokenB) return null;

      const pool = getPoolByTokens(tokenA.address, tokenB.address);
      if (!pool) return null;

      const isTokenAFirst = pool.tokenA.address === tokenA.address;
      const reserveA = parseFloat(isTokenAFirst ? pool.reserveA : pool.reserveB);
      const reserveB = parseFloat(isTokenAFirst ? pool.reserveB : pool.reserveA);

      const decimalDiff = tokenB.decimals - tokenA.decimals;
      const rate = (reserveB / reserveA) * Math.pow(10, decimalDiff);

      return {
        rate,
        formatted: `1 ${tokenA.symbol} = ${rate.toFixed(4)} ${tokenB.symbol}`,
      };
    },
    enabled: !!tokenA && !!tokenB,
    refetchInterval: 10000,
  });
}
