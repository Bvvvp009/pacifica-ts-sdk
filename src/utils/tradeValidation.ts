/**
 * Trading Validation and Helper Utilities
 * Provides validation functions and helpers for trading operations
 */

/**
 * Common tick sizes for major markets
 */
export const TICK_SIZES: Record<string, number> = {
  BTC: 1,     // $1 tick size
  ETH: 0.1,   // $0.1 tick size
  SOL: 0.01,  // $0.01 tick size
  DOGE: 0.00001, // $0.00001 tick size
};

/**
 * Minimum order values in USD
 */
export const MIN_ORDER_VALUE = 10; // $10 minimum

/**
 * Maximum price deviation from mark price (as a percentage)
 */
export const MAX_PRICE_DEVIATION = 0.20; // 20%

/**
 * Round a price to the nearest valid tick size
 * @param price - The price to round
 * @param symbol - The trading symbol (e.g., 'BTC', 'ETH')
 * @returns Rounded price as a string
 */
export function roundToTickSize(price: number, symbol: string): string {
  const tickSize = TICK_SIZES[symbol] || 0.01; // Default to 0.01 if not specified
  const rounded = Math.round(price / tickSize) * tickSize;
  
  // Determine decimal places based on tick size
  const decimals = tickSize >= 1 ? 0 : Math.abs(Math.floor(Math.log10(tickSize)));
  
  return rounded.toFixed(decimals);
}

/**
 * Validate if a price is within acceptable range of mark price
 * @param price - The order price
 * @param markPrice - Current mark price
 * @param maxDeviation - Maximum allowed deviation (default 20%)
 * @returns Object with isValid flag and error message
 */
export function validatePriceRange(
  price: number,
  markPrice: number,
  maxDeviation: number = MAX_PRICE_DEVIATION
): { isValid: boolean; error?: string } {
  const deviation = Math.abs((price - markPrice) / markPrice);
  
  if (deviation > maxDeviation) {
    return {
      isValid: false,
      error: `Price ${price} is too far from mark price ${markPrice} (${(deviation * 100).toFixed(1)}% deviation, max ${(maxDeviation * 100).toFixed(0)}%)`,
    };
  }
  
  return { isValid: true };
}

/**
 * Validate minimum order value
 * @param amount - Order amount
 * @param price - Order price
 * @param minValue - Minimum order value in USD (default $10)
 * @returns Object with isValid flag and error message
 */
export function validateMinOrderValue(
  amount: number,
  price: number,
  minValue: number = MIN_ORDER_VALUE
): { isValid: boolean; error?: string } {
  const orderValue = amount * price;
  
  if (orderValue < minValue) {
    return {
      isValid: false,
      error: `Order value $${orderValue.toFixed(2)} is below minimum $${minValue}`,
    };
  }
  
  return { isValid: true };
}

/**
 * Validate if user has sufficient balance for an order
 * @param orderValue - Total order value in USD
 * @param availableBalance - Available balance in USD
 * @returns Object with isValid flag and error message
 */
export function validateBalance(
  orderValue: number,
  availableBalance: number
): { isValid: boolean; error?: string } {
  if (orderValue > availableBalance) {
    return {
      isValid: false,
      error: `Insufficient balance: Order value $${orderValue.toFixed(2)} exceeds available balance $${availableBalance.toFixed(2)}`,
    };
  }
  
  return { isValid: true };
}

/**
 * Calculate Stop-Loss and Take-Profit prices with proper tick size rounding
 * @param entryPrice - Entry price for the position
 * @param side - Order side ('bid' for long, 'ask' for short)
 * @param symbol - Trading symbol
 * @param stopLossPercent - Stop-loss percentage (e.g., 5 for 5%)
 * @param takeProfitPercent - Take-profit percentage (e.g., 10 for 10%)
 * @returns Object with rounded SL and TP prices
 */
export function calculateSLTP(
  entryPrice: number,
  side: 'bid' | 'ask',
  symbol: string,
  stopLossPercent: number,
  takeProfitPercent: number
): { stopLoss: string; takeProfit: string } {
  const slMultiplier = side === 'bid' ? (1 - stopLossPercent / 100) : (1 + stopLossPercent / 100);
  const tpMultiplier = side === 'bid' ? (1 + takeProfitPercent / 100) : (1 - takeProfitPercent / 100);
  
  const stopLoss = roundToTickSize(entryPrice * slMultiplier, symbol);
  const takeProfit = roundToTickSize(entryPrice * tpMultiplier, symbol);
  
  return { stopLoss, takeProfit };
}

/**
 * Comprehensive order validation before submission
 * @param params - Order parameters
 * @param marketData - Current market data (mark price, etc.)
 * @param accountData - Account data (available balance)
 * @returns Object with isValid flag and array of error messages
 */
export interface OrderValidationParams {
  symbol: string;
  side: 'bid' | 'ask';
  amount: string;
  price?: string;
  orderType?: 'limit' | 'market';
}

export interface MarketData {
  markPrice: number;
}

export interface AccountData {
  availableBalance: number;
}

export function validateOrder(
  params: OrderValidationParams,
  marketData: MarketData,
  accountData: AccountData
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const amount = parseFloat(params.amount);
  const price = params.price ? parseFloat(params.price) : marketData.markPrice;
  
  // Validate amount
  if (isNaN(amount) || amount <= 0) {
    errors.push('Invalid amount: must be a positive number');
  }
  
  // Validate price for limit orders
  if (params.orderType === 'limit' && params.price) {
    if (isNaN(price) || price <= 0) {
      errors.push('Invalid price: must be a positive number');
    } else {
      // Check tick size
      const tickSize = TICK_SIZES[params.symbol] || 0.01;
      const remainder = price % tickSize;
      if (remainder > 0.000001) {
        warnings.push(
          `Price ${price} may not align with tick size ${tickSize}. ` +
          `Recommended: ${roundToTickSize(price, params.symbol)}`
        );
      }
      
      // Check price range
      const priceValidation = validatePriceRange(price, marketData.markPrice);
      if (!priceValidation.isValid) {
        errors.push(priceValidation.error!);
      }
    }
  }
  
  // Validate minimum order value
  const minValueValidation = validateMinOrderValue(amount, price);
  if (!minValueValidation.isValid) {
    errors.push(minValueValidation.error!);
  }
  
  // Validate balance
  const orderValue = amount * price;
  const balanceValidation = validateBalance(orderValue, accountData.availableBalance);
  if (!balanceValidation.isValid) {
    errors.push(balanceValidation.error!);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Format validation results for display
 * @param result - Validation result
 * @returns Formatted string message
 */
export function formatValidationResult(result: {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}): string {
  let message = '';
  
  if (result.errors.length > 0) {
    message += '❌ Validation Errors:\n';
    result.errors.forEach((error, i) => {
      message += `   ${i + 1}. ${error}\n`;
    });
  }
  
  if (result.warnings.length > 0) {
    message += '⚠️  Warnings:\n';
    result.warnings.forEach((warning, i) => {
      message += `   ${i + 1}. ${warning}\n`;
    });
  }
  
  if (result.isValid && result.warnings.length === 0) {
    message = '✅ Order validation passed';
  }
  
  return message.trim();
}
