/**
 * Validate token amount input
 */
export const isValidAmount = (value: string): boolean => {
  if (!value || value === '') return false;
  const num = parseFloat(value);
  return !isNaN(num) && num > 0 && isFinite(num);
};

/**
 * Check if amount exceeds balance
 */
export const exceedsBalance = (amount: string, balance: string, decimals: number): boolean => {
  const amountValue = parseFloat(amount) * Math.pow(10, decimals);
  const balanceValue = parseFloat(balance);
  return amountValue > balanceValue;
};

/**
 * Validate slippage input
 */
export const isValidSlippage = (value: number): boolean => {
  return value > 0 && value <= 50;
};

/**
 * Sanitize numeric input
 */
export const sanitizeNumericInput = (value: string): string => {
  // Remove any non-numeric characters except decimal point
  let sanitized = value.replace(/[^0-9.]/g, '');

  // Ensure only one decimal point
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    sanitized = parts[0] + '.' + parts.slice(1).join('');
  }

  return sanitized;
};
