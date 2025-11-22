/**
 * Order Management Examples
 * 
 * This example demonstrates how to create, cancel, and manage orders
 * using the Pacifica TypeScript SDK.
 */

import { SignClient } from '../src/clients/SignClient';
import { ApiClient } from '../src/clients/ApiClient';
import { generateKeypair, publicKeyToBase58 } from '../src/utils/signer';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

async function orderExamples() {
  console.log('📝 Order Management Examples\n');

  // Initialize clients
  const privateKey = process.env.PRIVATE_KEY!;
  const keypair = await generateKeypair(privateKey);
  const publicKey = publicKeyToBase58(keypair.publicKey);

  const signClient = new SignClient(privateKey, {
    accountPublicKey: publicKey,
    baseUrl: process.env.PACIFICA_REST_URL || 'https://api.pacifica.fi',
  });

  const apiClient = new ApiClient({
    baseUrl: process.env.PACIFICA_REST_URL || 'https://api.pacifica.fi',
  });

  try {
    // 1. Unified createOrder - Limit order with SL/TP
    console.log('1️⃣  Unified createOrder - Creating a limit order with SL/TP...');
    const entryPrice = '50000';
    const takeProfitPrice = '55000';  // 10% above entry
    const stopLossPrice = '47500';    // 5% below entry
    
    try {
      const unifiedLimitOrder = await signClient.createOrder({
        order_type: 'limit', // limit, market, twap
        symbol: 'BTC',  // BTC, ETH, SOL, etc.
        side: 'bid',  // bid, ask
        amount: '0.001',  // amount of the order
        price: entryPrice,  // price of the order
        reduce_only: false,  // reduce only
        tif: 'GTC',  // time in force
        client_order_id: randomUUID(),  // client order id
        take_profit: {
          stop_price: takeProfitPrice,  // stop price
          limit_price: takeProfitPrice,  // limit price
        },
        stop_loss: {
          stop_price: stopLossPrice,  // stop price
          // Omitting limit_price to use market order at trigger
        },
      });
      if (unifiedLimitOrder.success) {
        console.log('✅ Unified createOrder (limit) with SL/TP created:', unifiedLimitOrder.data);
        console.log(`   Entry Price: ${entryPrice}`);
        console.log(`   Take Profit: ${takeProfitPrice} (+10%)`);
        console.log(`   Stop Loss: ${stopLossPrice} (-5%)`);
      } else {
        console.log('⚠️  Limit order failed:', unifiedLimitOrder.error?.message || 'Unknown error');
        console.log('   Error code:', unifiedLimitOrder.error?.code || 'N/A');
      }
    } catch (error: any) {
      console.log('⚠️  Limit order failed:', error.message);
      if (error.responseData) {
        console.log('   Error details:', JSON.stringify(error.responseData, null, 2));
      }
    }

    // 1b. Explicit createLimitOrder method (alternative to unified method)
    console.log('\n1b️⃣  Explicit createLimitOrder method...');
    try {
      const limitOrder = await signClient.createLimitOrder({
        symbol: 'BTC',
        side: 'bid',
        amount: '0.001',
        price: entryPrice,
        reduce_only: false,
        tif: 'GTC',
        client_order_id: randomUUID(),
        take_profit: {
          stop_price: takeProfitPrice,
          limit_price: takeProfitPrice,
        },
        stop_loss: {
          stop_price: stopLossPrice,
        },
      });
      if (limitOrder.success) {
        console.log('✅ Limit order with SL/TP created:', limitOrder.data);
      } else {
        console.log('⚠️  Limit order failed:', limitOrder.error?.message || 'Unknown error');
        console.log('   Error code:', limitOrder.error?.code || 'N/A');
      }
    } catch (error: any) {
      console.log('⚠️  Limit order failed:', error.message);
      if (error.responseData) {
        console.log('   Error details:', JSON.stringify(error.responseData, null, 2));
      }
    }

    // 2. Unified createOrder - Market order with SL/TP
    console.log('\n2️⃣  Unified createOrder - Creating a market order with SL/TP...');
    try {
      const unifiedMarketOrder = await signClient.createOrder({
        order_type: 'market',
        symbol: 'BTC',
        side: 'bid',
        amount: '0.002', // Minimum ~$12 at $60k price
        slippage_percent: '0.5',
        take_profit: {
          stop_price: '52000',
          limit_price: '52100',
        },
        stop_loss: {
          stop_price: '48000',
        },
      });
      if (unifiedMarketOrder.success) {
        console.log('✅ Unified createOrder (market) with SL/TP created:', unifiedMarketOrder.data);
      } else {
        console.log('⚠️  Market order failed:', unifiedMarketOrder.error?.message || 'Unknown error');
        console.log('   Error code:', unifiedMarketOrder.error?.code || 'N/A');
        console.log('   Note: Market orders require minimum $10 value and sufficient balance');
      }
    } catch (error: any) {
      console.log('⚠️  Market order failed:', error.message);
      if (error.responseData) {
        console.log('   Error details:', JSON.stringify(error.responseData, null, 2));
      }
      console.log('   Note: Market orders require minimum $10 value and sufficient balance');
    }

    // 2b. Explicit createMarketOrder method (alternative to unified method)
    console.log('\n2b️⃣  Explicit createMarketOrder method...');
    try {
      const marketOrder = await signClient.createMarketOrder({
        symbol: 'BTC',
        side: 'bid',
        amount: '0.002', // Minimum ~$12 at $60k price
        slippage_percent: '0.5',
        take_profit: {
          stop_price: '52000',
          limit_price: '52100',
        },
        stop_loss: {
          stop_price: '48000',
        },
      });
      if (marketOrder.success) {
        console.log('✅ Market order with SL/TP created:', marketOrder.data);
      } else {
        console.log('⚠️  Market order failed:', marketOrder.error?.message || 'Unknown error');
        console.log('   Error code:', marketOrder.error?.code || 'N/A');
        console.log('   Note: Check balance, minimum order size, and slippage settings');
      }
    } catch (error: any) {
      console.log('⚠️  Market order failed:', error.message);
      if (error.responseData) {
        console.log('   Error details:', JSON.stringify(error.responseData, null, 2));
      }
      console.log('   Note: Check balance, minimum order size, and slippage settings');
    }

    // 3. Unified createOrder - TWAP order (SL/TP not supported by API)
    console.log('\n3️⃣  Unified createOrder - Creating a TWAP order...');
    try {
      // Note: TWAP orders do NOT support SL/TP parameters
      const unifiedTWAPOrder = await signClient.createOrder({
        order_type: 'twap',
        symbol: 'BTC',
        side: 'bid',
        amount: '0.002',
        slippage_percent: '0.5',
        duration_in_seconds: 3600, // 1 hour
        reduce_only: false,
        client_order_id: randomUUID(),
        // SL/TP not supported for TWAP orders
      });
      if (unifiedTWAPOrder.success) {
        console.log('✅ Unified createOrder (TWAP) created:', unifiedTWAPOrder.data);
      } else {
        console.log('⚠️  TWAP order failed:', unifiedTWAPOrder.error?.message || 'Unknown error');
        console.log('   Error code:', unifiedTWAPOrder.error?.code || 'N/A');
        console.log('   Note: TWAP orders may require different parameters, minimum amounts, or sufficient balance');
      }
    } catch (error: any) {
      console.log('⚠️  TWAP order failed:', error.message);
      if (error.responseData) {
        console.log('   Error details:', JSON.stringify(error.responseData, null, 2));
      }
      console.log('   Note: TWAP orders may require different parameters, minimum amounts, or sufficient balance');
    }

    // 4. Get open orders
    console.log('\n4️⃣  Fetching open orders...');
    const openOrders = await apiClient.getOpenOrders(publicKey);
    console.log('✅ Open orders:', openOrders.data);

    // 5. Get order history
    console.log('\n5️⃣  Fetching order history...');
    const orderHistory = await apiClient.getOrderHistory(publicKey, 'BTC', 10);
    console.log('✅ Order history:', orderHistory.data);

    // 6. Cancel an order
    if (openOrders.data && Array.isArray(openOrders.data) && openOrders.data.length > 0) {
      // Find a cancelable order (limit orders, not stop/take-profit orders)
      const cancelableOrders = openOrders.data.filter((o: any) => 
        o.order_type === 'limit' && !o.stop_parent_order_id
      );
      
      if (cancelableOrders.length > 0) {
        const orderToCancel = cancelableOrders[0] as any;
        console.log('\n6️⃣  Canceling order:', orderToCancel.order_id);
        console.log(`   Order type: ${orderToCancel.order_type}, Symbol: ${orderToCancel.symbol}`);
        try {
          const cancelResult = await signClient.cancelOrder({
            order_id: orderToCancel.order_id.toString(),
            symbol: orderToCancel.symbol || 'BTC',
          });
          if (cancelResult.success) {
            console.log('✅ Order canceled:', cancelResult.data);
          } else {
            console.log('⚠️  Cancel failed:', cancelResult.error?.message || JSON.stringify(cancelResult.error));
            console.log('   Note: Order may have already filled or been canceled');
          }
        } catch (error: any) {
          console.log('⚠️  Cancel failed:', error.message);
          if (error.responseData) {
            console.log('   Error details:', JSON.stringify(error.responseData, null, 2));
          }
          console.log('   Note: Order may have already filled or been canceled');
        }
      } else {
        console.log('\n6️⃣  No cancelable limit orders found');
        console.log('   Note: Only limit orders (not stop/take-profit orders) can be canceled individually');
      }
    } else {
      console.log('\n6️⃣  No open orders to cancel');
    }

    // 7. Cancel all orders for a market
    console.log('\n7️⃣  Canceling all orders for BTC...');
    try {
      const cancelAllResult = await signClient.cancelAllOrders('BTC');
      if (cancelAllResult.success) {
        console.log('✅ All orders canceled:', cancelAllResult.data);
      } else {
        console.log('⚠️  Cancel all failed:', cancelAllResult.error?.message || JSON.stringify(cancelAllResult.error));
      }
    } catch (error: any) {
      console.log('⚠️  Cancel all orders failed:', error.message);
      if (error.responseData) {
        console.log('   Error details:', JSON.stringify(error.responseData, null, 2));
      }
      console.log('   Note: This may fail if there are no orders to cancel or if orders are already canceled');
    }

    // 8. Update Leverage (position-level setting)
    // Note: Requires an open position
    console.log('\n8️⃣  Updating Leverage for BTC position...');
    try {
      // First check if we have a position
      const positions = await apiClient.getPositions(publicKey);
      if (positions.success && positions.data && Array.isArray(positions.data) && positions.data.length > 0) {
        const leverageResult = await signClient.updateLeverage({
          market: 'BTC',
          leverage: 10, // 10x leverage
        });
        if (leverageResult.success) {
          console.log('✅ Leverage updated successfully!');
          console.log('Result:', JSON.stringify(leverageResult.data, null, 2));
        } else {
          console.log('⚠️  Failed to update leverage:', leverageResult.error?.message || JSON.stringify(leverageResult.error));
        }
      } else {
        console.log('⚠️  No open position found. Leverage can only be updated when you have an open position.');
      }
    } catch (error: any) {
      console.log('⚠️  Update leverage failed:', error.message);
    }

    // 9. Update Margin Mode (position-level setting)
    // Note: Requires an open position
    console.log('\n9️⃣  Updating Margin Mode for BTC position...');
    try {
      const positions = await apiClient.getPositions(publicKey);
      if (positions.success && positions.data && Array.isArray(positions.data) && positions.data.length > 0) {
        const marginModeResult = await signClient.updateMarginMode({
          market: 'BTC',
          margin_mode: 'isolated', // or 'cross'
        });
        if (marginModeResult.success) {
          console.log('✅ Margin mode updated successfully!');
          console.log('Result:', JSON.stringify(marginModeResult.data, null, 2));
        } else {
          console.log('⚠️  Failed to update margin mode:', marginModeResult.error?.message || JSON.stringify(marginModeResult.error));
        }
      } else {
        console.log('⚠️  No open position found. Margin mode can only be updated when you have an open position.');
      }
    } catch (error: any) {
      console.log('⚠️  Update margin mode failed:', error.message);
    }

    // 10. Modify Position (combines leverage + margin mode)
    // Note: Requires an open position
    console.log('\n🔟  Modifying Position (Leverage + Margin Mode)...');
    try {
      const positions = await apiClient.getPositions(publicKey);
      if (positions.success && positions.data && Array.isArray(positions.data) && positions.data.length > 0) {
        const modifyResult = await signClient.modifyPosition({
          market: 'BTC',
          leverage: 15, // 15x leverage
          margin_mode: 'isolated', // Isolated margin
        });
        if (modifyResult.success) {
          console.log('✅ Position modified successfully!');
          console.log('Result:', JSON.stringify(modifyResult.data, null, 2));
        } else {
          console.log('⚠️  Failed to modify position:', modifyResult.error?.message || JSON.stringify(modifyResult.error));
        }
      } else {
        console.log('⚠️  No open position found. Position can only be modified when you have an open position.');
      }
    } catch (error: any) {
      console.log('⚠️  Modify position failed:', error.message);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.responseData) {
      console.error('Response:', JSON.stringify(error.responseData, null, 2));
    }
    if (error.success === false && error.error) {
      console.error('API Error:', JSON.stringify(error.error, null, 2));
    }
  }
}

// Run example
orderExamples().catch(console.error);

export default orderExamples;

