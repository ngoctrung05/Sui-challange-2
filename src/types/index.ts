export interface Token {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
  logoUrl?: string;
  faucetEnabled?: boolean;
  faucetAmount?: string;
}

export interface FaucetParams {
  token: Token;
  recipient: string;
}

export interface Pool {
  id: string;
  tokenA: Token;
  tokenB: Token;
  reserveA: string;
  reserveB: string;
  totalSupply: string;
  fee: number;
}

export interface Position {
  id: string;
  pool: Pool;
  liquidity: string;
  tokenAAmount: string;
  tokenBAmount: string;
  sharePercent: number;
  valueUsd?: string;
}

export interface SwapQuote {
  inputToken: Token;
  outputToken: Token;
  inputAmount: string;
  outputAmount: string;
  priceImpact: number;
  fee: string;
  route: string[];
}

export interface SwapParams {
  inputToken: Token;
  outputToken: Token;
  inputAmount: string;
  minOutputAmount: string;
  slippage: number;
}

export interface AddLiquidityParams {
  pool: Pool;
  tokenAAmount: string;
  tokenBAmount: string;
  minLpTokens: string;
  slippage: number;
}

export interface RemoveLiquidityParams {
  position: Position;
  percentage: number;
  minTokenAAmount: string;
  minTokenBAmount: string;
  slippage: number;
}

export interface TransactionResult {
  success: boolean;
  digest?: string;
  error?: string;
}

export interface TokenBalance {
  token: Token;
  balance: string;
  balanceUsd?: string;
}
