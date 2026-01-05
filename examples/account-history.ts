/**
 * Example: Account History and Analytics
 * Demonstrates how to fetch trade history, funding payments, and account equity
 */

import { SignClient, ApiClient } from '../src';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  // Initialize clients
  const privateKey = process.env.PRIVATE_KEY || 'your-private-key-here';
  const signClient = new SignClient(privateKey);
  const apiClient = new ApiClient({ baseUrl: 'https://api.pacifica.fi' });

  // Get account public key
  const { generateKeypair, publicKeyToBase58 } = await import('../src/utils/signer');
  const keypair = await generateKeypair(privateKey);
  const account = publicKeyToBase58(keypair.publicKey);

  console.log('=== Account History Examples ===');
  console.log(`Account: ${account}\n`);

  // 1. Get trade history
  console.log('1. Fetching recent trades...');
  try {
    const trades = await apiClient.getTradeHistory(account, undefined, undefined, undefined, 10);
    
    if (trades.success && trades.data) {
      console.log(`  Found ${trades.data.length} recent trades`);
      
      trades.data.forEach((trade, index) => {
        console.log(`\n  Trade ${index + 1}:`);
        console.log(`    Symbol: ${trade.symbol}`);
        console.log(`    Side: ${trade.side}`);
        console.log(`    Amount: ${trade.amount}`);
        console.log(`    Price: ${trade.price}`);
        console.log(`    PnL: ${trade.pnl}`);
        console.log(`    Fee: ${trade.fee}`);
        console.log(`    Time: ${new Date(trade.created_at).toLocaleString()}`);
      });

      if (trades.has_more) {
        console.log(`\n  More trades available. Use cursor: ${trades.next_cursor}`);
      }
    }
  } catch (error) {
    console.error('Error fetching trades:', error);
  }

  // 2. Get trades for specific symbol
  console.log('\n2. Fetching BTC trades...');
  try {
    const btcTrades = await apiClient.getTradeHistory(account, 'BTC', undefined, undefined, 5);
    
    if (btcTrades.success && btcTrades.data) {
      console.log(`  Found ${btcTrades.data.length} BTC trades`);
      
      // Calculate total PnL for BTC
      const totalPnl = btcTrades.data.reduce((sum, trade) => {
        return sum + parseFloat(trade.pnl);
      }, 0);
      
      console.log(`  Total PnL from recent BTC trades: ${totalPnl.toFixed(2)} USDC`);
    }
  } catch (error) {
    console.error('Error fetching BTC trades:', error);
  }

  // 3. Get funding payment history
  console.log('\n3. Fetching funding payment history...');
  try {
    const funding = await apiClient.getFundingHistory(account, undefined, 10);
    
    if (funding.success && funding.data) {
      console.log(`  Found ${funding.data.length} funding payments`);
      
      let totalFundingPaid = 0;
      let totalFundingReceived = 0;

      funding.data.forEach((payment, index) => {
        const payout = parseFloat(payment.payout);
        if (payout > 0) {
          totalFundingReceived += payout;
        } else {
          totalFundingPaid += Math.abs(payout);
        }

        console.log(`\n  Payment ${index + 1}:`);
        console.log(`    Symbol: ${payment.symbol}`);
        console.log(`    Side: ${payment.side}`);
        console.log(`    Rate: ${(parseFloat(payment.rate) * 100).toFixed(4)}%`);
        console.log(`    Payout: ${payment.payout} USDC`);
        console.log(`    Time: ${new Date(payment.created_at).toLocaleString()}`);
      });

      console.log(`\n  Summary:`);
      console.log(`    Total Received: ${totalFundingReceived.toFixed(2)} USDC`);
      console.log(`    Total Paid: ${totalFundingPaid.toFixed(2)} USDC`);
      console.log(`    Net: ${(totalFundingReceived - totalFundingPaid).toFixed(2)} USDC`);
    }
  } catch (error) {
    console.error('Error fetching funding history:', error);
  }

  // 4. Get account equity history
  console.log('\n4. Fetching account equity history...');
  try {
    const oneDayAgo = Date.now() - 86400000;
    const equity = await apiClient.getAccountEquityHistory(account, oneDayAgo);
    
    if (equity.success && equity.data && equity.data.length > 0) {
      console.log(`  Retrieved ${equity.data.length} equity snapshots`);
      
      const first = equity.data[0];
      const last = equity.data[equity.data.length - 1];
      
      console.log(`\n  24h Equity Change:`);
      console.log(`    Start: ${first.equity} USDC`);
      console.log(`    End: ${last.equity} USDC`);
      
      const change = parseFloat(last.equity) - parseFloat(first.equity);
      const percentChange = (change / parseFloat(first.equity)) * 100;
      
      console.log(`    Change: ${change > 0 ? '+' : ''}${change.toFixed(2)} USDC (${percentChange.toFixed(2)}%)`);
      
      // Display current breakdown
      console.log(`\n  Current Breakdown:`);
      console.log(`    Balance: ${last.balance} USDC`);
      console.log(`    Unrealized PnL: ${last.unrealized_pnl} USDC`);
    }
  } catch (error) {
    console.error('Error fetching equity history:', error);
  }

  // 5. Get account settings
  console.log('\n5. Fetching account settings...');
  try {
    const settings = await apiClient.getAccountSettings(account);
    
    if (settings.success && settings.data) {
      if (settings.data.length === 0) {
        console.log('  All markets using default settings (cross margin, max leverage)');
      } else {
        console.log(`  Found ${settings.data.length} markets with custom settings:`);
        
        settings.data.forEach((setting) => {
          console.log(`\n  ${setting.symbol}:`);
          console.log(`    Margin Mode: ${setting.isolated ? 'Isolated' : 'Cross'}`);
          console.log(`    Leverage: ${setting.leverage}x`);
          console.log(`    Last Updated: ${new Date(setting.updated_at).toLocaleString()}`);
        });
      }
    }
  } catch (error) {
    console.error('Error fetching account settings:', error);
  }

  // 6. Pagination example - fetch all trades from last 7 days
  console.log('\n6. Fetching all trades from last 7 days with pagination...');
  try {
    const sevenDaysAgo = Date.now() - 7 * 86400000;
    let allTrades: any[] = [];
    let cursor: string | undefined;
    let page = 1;

    do {
      const response = await apiClient.getTradeHistory(
        account,
        undefined,
        sevenDaysAgo,
        undefined,
        100,
        cursor
      );

      if (response.success && response.data) {
        allTrades = allTrades.concat(response.data);
        cursor = response.has_more ? response.next_cursor : undefined;
        console.log(`  Fetched page ${page}: ${response.data.length} trades`);
        page++;
      } else {
        break;
      }
    } while (cursor);

    console.log(`\n  Total trades in last 7 days: ${allTrades.length}`);
    
    // Calculate statistics
    if (allTrades.length > 0) {
      const totalPnl = allTrades.reduce((sum, t) => sum + parseFloat(t.pnl), 0);
      const totalFees = allTrades.reduce((sum, t) => sum + parseFloat(t.fee), 0);
      
      console.log(`  Total PnL: ${totalPnl.toFixed(2)} USDC`);
      console.log(`  Total Fees: ${totalFees.toFixed(2)} USDC`);
      console.log(`  Net PnL: ${(totalPnl - totalFees).toFixed(2)} USDC`);
    }
  } catch (error) {
    console.error('Error fetching paginated trades:', error);
  }
}

// Run the example
main().catch(console.error);
