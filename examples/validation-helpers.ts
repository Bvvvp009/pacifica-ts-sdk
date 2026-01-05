/**
 * Example: Order Validation and Helper Functions
 * Demonstrates how to use validation utilities before submitting orders
 */

import { SignClient, ApiClient } from '../src';
import {
  roundToTickSize,
  calculateSLTP,
  validateOrder,
  validatePriceRange,
  validateMinOrderValue,
  validateBalance,
  formatValidationResult,
} from '../src/utils/tradeValidation';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('🔍 Order Validation and Helper Examples\n');
  console.log('='.repeat(80));
  
  // Initialize clients
  const privateKey = process.env.PRIVATE_KEY!;
  const signClient = new SignClient(privateKey);
  const apiClient = new ApiClient();
  
  // Get account info
  const { generateKeypair, publicKeyToBase58 } = await import('../src/utils/signer');
  const keypair = await generateKeypair(privateKey);
  const account = publicKeyToBase58(keypair.publicKey);
  
  // Fetch account balance
  const balanceData = await apiClient.getBalance(account);
  const balance = balanceData.success && balanceData.data 
    ? parseFloat(balanceData.data.balance) 
    : 0;
  
  // Fetch BTC mark price
  const priceData = await apiClient.getPrices('BTC');
  const markPrice = priceData.success && priceData.data && priceData.data.length > 0
    ? parseFloat(priceData.data[0].mark)
    : 90000; // Fallback
  
  console.log(`\n📊 Current Market Data:`);
  console.log(`   Account Balance: $${balance.toFixed(2)}`);
  console.log(`   BTC Mark Price: $${markPrice.toFixed(2)}`);
  
  // ========================================================================
  // Example 1: Tick Size Rounding
  // ========================================================================
  console.log('\n\n1️⃣  TICK SIZE ROUNDING');
  console.log('-'.repeat(80));
  
  const prices = [89756.789, 3107.456, 156.123456];
  const symbols = ['BTC', 'ETH', 'SOL'];
  
  console.log('\nRounding prices to valid tick sizes:\n');
  symbols.forEach((symbol, i) => {
    const original = prices[i];
    const rounded = roundToTickSize(original, symbol);
    console.log(`   ${symbol}: $${original} → $${rounded}`);
  });
  
  // ========================================================================
  // Example 2: Calculate Stop-Loss and Take-Profit
  // ========================================================================
  console.log('\n\n2️⃣  STOP-LOSS & TAKE-PROFIT CALCULATION');
  console.log('-'.repeat(80));
  
  const entryPrice = markPrice;
  console.log(`\nLONG Position (buy/bid) at $${entryPrice}:`);
  const longSLTP = calculateSLTP(entryPrice, 'bid', 'BTC', 5, 10);
  console.log(`   Entry: $${entryPrice.toFixed(2)}`);
  console.log(`   Stop-Loss (-5%): $${longSLTP.stopLoss}`);
  console.log(`   Take-Profit (+10%): $${longSLTP.takeProfit}`);
  
  console.log(`\nSHORT Position (sell/ask) at $${entryPrice}:`);
  const shortSLTP = calculateSLTP(entryPrice, 'ask', 'BTC', 5, 10);
  console.log(`   Entry: $${entryPrice.toFixed(2)}`);
  console.log(`   Stop-Loss (+5%): $${shortSLTP.stopLoss}`);
  console.log(`   Take-Profit (-10%): $${shortSLTP.takeProfit}`);
  
  // ========================================================================
  // Example 3: Price Range Validation
  // ========================================================================
  console.log('\n\n3️⃣  PRICE RANGE VALIDATION');
  console.log('-'.repeat(80));
  
  const testPrices = [
    { price: markPrice * 0.95, label: '5% below mark' },
    { price: markPrice * 1.15, label: '15% above mark' },
    { price: markPrice * 0.70, label: '30% below mark (invalid)' },
  ];
  
  console.log(`\nValidating prices against mark price ($${markPrice.toFixed(2)}):\n`);
  testPrices.forEach(({ price, label }) => {
    const result = validatePriceRange(price, markPrice);
    const icon = result.isValid ? '✅' : '❌';
    console.log(`   ${icon} ${label}: $${price.toFixed(2)}`);
    if (!result.isValid) {
      console.log(`      ${result.error}`);
    }
  });
  
  // ========================================================================
  // Example 4: Minimum Order Value Validation
  // ========================================================================
  console.log('\n\n4️⃣  MINIMUM ORDER VALUE VALIDATION');
  console.log('-'.repeat(80));
  
  const testOrders = [
    { amount: 0.001, price: markPrice, label: 'Large order' },
    { amount: 0.0001, price: markPrice, label: 'Small order (below $10)' },
  ];
  
  console.log('\nValidating order sizes (minimum $10):\n');
  testOrders.forEach(({ amount, price, label }) => {
    const result = validateMinOrderValue(amount, price);
    const value = amount * price;
    const icon = result.isValid ? '✅' : '❌';
    console.log(`   ${icon} ${label}: ${amount} BTC × $${price.toFixed(2)} = $${value.toFixed(2)}`);
    if (!result.isValid) {
      console.log(`      ${result.error}`);
    }
  });
  
  // ========================================================================
  // Example 5: Balance Validation
  // ========================================================================
  console.log('\n\n5️⃣  BALANCE VALIDATION');
  console.log('-'.repeat(80));
  
  const orderValue1 = 5; // $5
  const orderValue2 = balance + 10; // More than available
  
  console.log(`\nAvailable Balance: $${balance.toFixed(2)}\n`);
  
  let result1 = validateBalance(orderValue1, balance);
  console.log(`   ${result1.isValid ? '✅' : '❌'} Order value: $${orderValue1.toFixed(2)}`);
  if (!result1.isValid) console.log(`      ${result1.error}`);
  
  let result2 = validateBalance(orderValue2, balance);
  console.log(`   ${result2.isValid ? '✅' : '❌'} Order value: $${orderValue2.toFixed(2)}`);
  if (!result2.isValid) console.log(`      ${result2.error}`);
  
  // ========================================================================
  // Example 6: Comprehensive Order Validation
  // ========================================================================
  console.log('\n\n6️⃣  COMPREHENSIVE ORDER VALIDATION');
  console.log('-'.repeat(80));
  
  // Test Case 1: Valid order
  console.log('\n📋 Test Case 1: Valid Limit Order\n');
  const validOrder = {
    symbol: 'BTC',
    side: 'bid' as const,
    amount: '0.001',
    price: markPrice.toString(),
    orderType: 'limit' as const,
  };
  
  const validation1 = validateOrder(
    validOrder,
    { markPrice },
    { availableBalance: balance }
  );
  
  console.log(formatValidationResult(validation1));
  console.log(`\n   Order Details:`);
  console.log(`   • Symbol: ${validOrder.symbol}`);
  console.log(`   • Side: ${validOrder.side}`);
  console.log(`   • Amount: ${validOrder.amount} BTC`);
  console.log(`   • Price: $${validOrder.price}`);
  console.log(`   • Value: $${(parseFloat(validOrder.amount) * parseFloat(validOrder.price)).toFixed(2)}`);
  
  // Test Case 2: Order with issues
  console.log('\n\n📋 Test Case 2: Order with Validation Issues\n');
  const invalidOrder = {
    symbol: 'BTC',
    side: 'bid' as const,
    amount: '0.0001', // Too small
    price: (markPrice * 0.6).toString(), // Too far from mark
    orderType: 'limit' as const,
  };
  
  const validation2 = validateOrder(
    invalidOrder,
    { markPrice },
    { availableBalance: balance }
  );
  
  console.log(formatValidationResult(validation2));
  
  // ========================================================================
  // Example 7: Create a Validated Order
  // ========================================================================
  console.log('\n\n7️⃣  CREATING A VALIDATED ORDER');
  console.log('-'.repeat(80));
  
  // Calculate safe order parameters
  const orderAmount = 0.001; // 0.001 BTC
  const orderPrice = roundToTickSize(markPrice * 0.95, 'BTC'); // 5% below market
  const sltp = calculateSLTP(parseFloat(orderPrice), 'bid', 'BTC', 5, 10);
  
  console.log('\n📊 Order Parameters:');
  console.log(`   Symbol: BTC`);
  console.log(`   Side: bid (buy/long)`);
  console.log(`   Amount: ${orderAmount} BTC`);
  console.log(`   Price: $${orderPrice} (5% below market)`);
  console.log(`   Stop-Loss: $${sltp.stopLoss} (-5%)`);
  console.log(`   Take-Profit: $${sltp.takeProfit} (+10%)`);
  console.log(`   Order Value: $${(orderAmount * parseFloat(orderPrice)).toFixed(2)}`);
  
  // Validate before creating
  const finalValidation = validateOrder(
    {
      symbol: 'BTC',
      side: 'bid',
      amount: orderAmount.toString(),
      price: orderPrice,
      orderType: 'limit',
    },
    { markPrice },
    { availableBalance: balance }
  );
  
  console.log(`\n🔍 Pre-Submission Validation:`);
  console.log(formatValidationResult(finalValidation));
  
  if (finalValidation.isValid) {
    console.log('\n✅ Order passes all validations - ready to submit!');
    console.log('\n💡 To create this order, uncomment the code below:\n');
    console.log('/*');
    console.log('  const orderResult = await signClient.createOrder({');
    console.log('    symbol: "BTC",');
    console.log('    side: "bid",');
    console.log(`    amount: "${orderAmount}",`);
    console.log(`    price: "${orderPrice}",`);
    console.log('    reduce_only: false,');
    console.log('    tif: "GTC",');
    console.log(`    stop_loss: { stop_price: "${sltp.stopLoss}" },`);
    console.log(`    take_profit: { stop_price: "${sltp.takeProfit}", limit_price: "${sltp.takeProfit}" },`);
    console.log(`    client_order_id: \`validated-order-\${Date.now()}\`,`);
    console.log('  });');
    console.log('*/');
  } else {
    console.log('\n❌ Order validation failed - please fix errors before submitting');
  }
  
  // ========================================================================
  // Summary
  // ========================================================================
  console.log('\n\n' + '='.repeat(80));
  console.log('📚 VALIDATION UTILITIES SUMMARY');
  console.log('='.repeat(80));
  console.log('\n✅ Available Helper Functions:\n');
  console.log('   • roundToTickSize() - Round prices to exchange tick sizes');
  console.log('   • calculateSLTP() - Calculate Stop-Loss and Take-Profit prices');
  console.log('   • validatePriceRange() - Check if price is within acceptable range');
  console.log('   • validateMinOrderValue() - Ensure order meets minimum value');
  console.log('   • validateBalance() - Verify sufficient balance');
  console.log('   • validateOrder() - Comprehensive pre-submission validation');
  console.log('   • formatValidationResult() - Format validation output');
  
  console.log('\n💡 Best Practices:\n');
  console.log('   1. Always validate orders before submission');
  console.log('   2. Use tick size rounding for all prices');
  console.log('   3. Calculate SL/TP with proper rounding');
  console.log('   4. Check balance before large orders');
  console.log('   5. Validate price distance from mark price');
  
  console.log('\n' + '='.repeat(80));
}

main().catch(console.error);
