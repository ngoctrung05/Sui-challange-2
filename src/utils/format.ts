/**
 * Format a token amount for display
 */
export const formatTokenAmount = (amount: string, decimals: number, displayDecimals = 4): string => {
  const value = parseFloat(amount) / Math.pow(10, decimals);
  if (value === 0) return '0';
  if (value < 0.0001) return '< 0.0001';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: displayDecimals,
  });
};

/**
 * Format USD value
 */
export const formatUsd = (amount: string | number): string => {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Format percentage
 */
export const formatPercent = (value: number, decimals = 2): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Parse token amount from user input
 */
export const parseTokenAmount = (input: string, decimals: number): string => {
  const value = parseFloat(input) || 0;
  return Math.floor(value * Math.pow(10, decimals)).toString();
};

/**
 * Truncate address for display
 */
export const truncateAddress = (address: string, chars = 4): string => {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

/**
 * Format large numbers with K, M, B suffixes
 */
export const formatCompactNumber = (value: number): string => {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }
  return value.toFixed(2);
};
