import { Transaction } from '@mysten/sui/transactions';
import type {
  SwapParams,
  AddLiquidityParams,
  RemoveLiquidityParams,
  SwapQuote,
  Pool,
  Token,
  FaucetParams,
} from '../types';
import { DEX_PACKAGE_ID, CLOCK_ID, DEFAULT_FEE_BPS, FEE_DENOMINATOR } from '../constants/config';

/**
 * Build a faucet request transaction
 * Calls: faucet::request_tokens_entry<T>(faucet, clock, ctx)
 */
export const buildFaucetTransaction = (params: FaucetParams): Transaction => {
  const tx = new Transaction();

  if (!params.token.faucetObjectId) {
    throw new Error(`Faucet not available for ${params.token.symbol}`);
  }

  tx.moveCall({
    target: `${DEX_PACKAGE_ID}::faucet::request_tokens_entry`,
    typeArguments: [params.token.address],
    arguments: [
      tx.object(params.token.faucetObjectId),
      tx.object(CLOCK_ID),
    ],
  });

  return tx;
};

/**
 * Build a swap transaction
 * Calls: swap::swap_x_to_y or swap::swap_y_to_x
 */
export const buildSwapTransaction = (
  params: SwapParams,
  pool: Pool,
  coinObjectId: string
): Transaction => {
  const tx = new Transaction();

  // Determine swap direction based on input token
  const isXToY = pool.tokenA.address === params.inputToken.address;
  const swapFunction = isXToY ? 'swap_x_to_y' : 'swap_y_to_x';

  // Type arguments in correct order (pool is always Pool<X, Y>)
  const typeArgs = [pool.tokenA.address, pool.tokenB.address];

  // Calculate minimum output with slippage
  const minOutput = Math.floor(
    parseFloat(params.minOutputAmount) * Math.pow(10, params.outputToken.decimals)
  );

  tx.moveCall({
    target: `${DEX_PACKAGE_ID}::swap::${swapFunction}`,
    typeArguments: typeArgs,
    arguments: [
      tx.object(pool.id),
      tx.object(coinObjectId),
      tx.pure.u64(minOutput),
    ],
  });

  return tx;
};

/**
 * Build an add liquidity transaction
 * Calls: liquidity::add_liquidity<X, Y>(pool, coin_x, coin_y, ctx)
 */
export const buildAddLiquidityTransaction = (
  params: AddLiquidityParams,
  coinXObjectId: string,
  coinYObjectId: string
): Transaction => {
  const tx = new Transaction();

  tx.moveCall({
    target: `${DEX_PACKAGE_ID}::liquidity::add_liquidity`,
    typeArguments: [params.pool.tokenA.address, params.pool.tokenB.address],
    arguments: [
      tx.object(params.pool.id),
      tx.object(coinXObjectId),
      tx.object(coinYObjectId),
    ],
  });

  return tx;
};

/**
 * Build a remove liquidity transaction
 * Calls: liquidity::remove_liquidity<X, Y>(pool, lp_coin, ctx)
 */
export const buildRemoveLiquidityTransaction = (
  params: RemoveLiquidityParams,
  lpCoinObjectId: string
): Transaction => {
  const tx = new Transaction();

  tx.moveCall({
    target: `${DEX_PACKAGE_ID}::liquidity::remove_liquidity`,
    typeArguments: [params.position.pool.tokenA.address, params.position.pool.tokenB.address],
    arguments: [
      tx.object(params.position.pool.id),
      tx.object(lpCoinObjectId),
    ],
  });

  return tx;
};

/**
 * Build a create pool transaction
 * Calls: pool::create_pool_and_share<X, Y>(ctx)
 */
export const buildCreatePoolTransaction = (
  tokenA: Token,
  tokenB: Token
): Transaction => {
  const tx = new Transaction();

  tx.moveCall({
    target: `${DEX_PACKAGE_ID}::pool::create_pool_and_share`,
    typeArguments: [tokenA.address, tokenB.address],
    arguments: [],
  });

  return tx;
};

/**
 * Calculate swap output using constant product formula
 * output = (input * (10000 - fee) * reserve_out) / (reserve_in * 10000 + input * (10000 - fee))
 */
export const calculateSwapOutput = (
  amountIn: number,
  reserveIn: number,
  reserveOut: number,
  feeBps: number = DEFAULT_FEE_BPS
): number => {
  if (amountIn <= 0 || reserveIn <= 0 || reserveOut <= 0) {
    return 0;
  }

  const amountInWithFee = amountIn * (FEE_DENOMINATOR - feeBps);
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn * FEE_DENOMINATOR + amountInWithFee;

  return Math.floor(numerator / denominator);
};

/**
 * Calculate price impact percentage
 */
export const calculatePriceImpact = (
  amountIn: number,
  amountOut: number,
  reserveIn: number,
  reserveOut: number
): number => {
  if (reserveIn <= 0 || reserveOut <= 0) {
    return 0;
  }

  const spotPrice = reserveOut / reserveIn;
  const executionPrice = amountOut / amountIn;
  const impact = ((spotPrice - executionPrice) / spotPrice) * 100;

  return Math.max(0, impact);
};

/**
 * Get a quote for a swap (client-side calculation)
 */
export const getSwapQuote = async (
  inputToken: Token,
  outputToken: Token,
  inputAmount: string,
  pool: Pool
): Promise<SwapQuote> => {
  const inputDecimals = inputToken.decimals;
  const outputDecimals = outputToken.decimals;

  const amountInRaw = parseFloat(inputAmount) * Math.pow(10, inputDecimals);

  // Determine which reserves to use based on swap direction
  const isXToY = pool.tokenA.address === inputToken.address;
  const reserveIn = parseFloat(isXToY ? pool.reserveA : pool.reserveB);
  const reserveOut = parseFloat(isXToY ? pool.reserveB : pool.reserveA);

  const amountOutRaw = calculateSwapOutput(amountInRaw, reserveIn, reserveOut);
  const amountOut = amountOutRaw / Math.pow(10, outputDecimals);

  const priceImpact = calculatePriceImpact(amountInRaw, amountOutRaw, reserveIn, reserveOut);

  const feeAmount = parseFloat(inputAmount) * (DEFAULT_FEE_BPS / FEE_DENOMINATOR);

  return {
    inputToken,
    outputToken,
    inputAmount,
    outputAmount: amountOut.toFixed(outputDecimals),
    priceImpact,
    fee: feeAmount.toFixed(inputDecimals),
    route: [inputToken.symbol, outputToken.symbol],
  };
};

/**
 * Calculate LP tokens to receive when adding liquidity
 */
export const calculateLpTokens = (
  amountA: number,
  amountB: number,
  reserveA: number,
  reserveB: number,
  totalSupply: number
): number => {
  if (totalSupply === 0) {
    // Initial liquidity: sqrt(amountA * amountB) - MINIMUM_LIQUIDITY
    const MINIMUM_LIQUIDITY = 1000;
    return Math.floor(Math.sqrt(amountA * amountB)) - MINIMUM_LIQUIDITY;
  }

  // Subsequent liquidity: min(amountA/reserveA, amountB/reserveB) * totalSupply
  const ratioA = (amountA * totalSupply) / reserveA;
  const ratioB = (amountB * totalSupply) / reserveB;

  return Math.floor(Math.min(ratioA, ratioB));
};

/**
 * Calculate token amounts when removing liquidity
 */
export const calculateRemoveLiquidity = (
  lpAmount: number,
  totalSupply: number,
  reserveA: number,
  reserveB: number
): { amountA: number; amountB: number } => {
  const share = lpAmount / totalSupply;

  return {
    amountA: Math.floor(reserveA * share),
    amountB: Math.floor(reserveB * share),
  };
};
