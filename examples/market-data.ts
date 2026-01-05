/**
 * Example: Market Data Fetching
 * Demonstrates how to fetch various market data using the new methods
 */

import { ApiClient } from '../src';

async function main() {
  // Initialize API client (no private key needed for market data)
  const apiClient = new ApiClient({
    baseUrl: 'https://api.pacifica.fi',
  });

  console.log('=== Market Data Examples ===\n');

  // 1. Get all prices
  console.log('1. Fetching prices for all markets...');
  try {
    const allPrices = await apiClient.getPrices();
    if (allPrices.success && allPrices.data) {
      console.log(`Found ${allPrices.data.length} markets`);
      // Display first 3 markets
      allPrices.data.slice(0, 3).forEach((price) => {
        console.log(`  ${price.symbol}:`);
        console.log(`    Mark Price: $${price.mark}`);
        console.log(`    Funding Rate: ${(parseFloat(price.funding) * 100).toFixed(4)}%`);
        console.log(`    24h Volume: $${price.volume_24h}`);
      });
    }
  } catch (error) {
    console.error('Error fetching prices:', error);
  }

  console.log('\n2. Fetching BTC price data...');
  try {
    const btcPrice = await apiClient.getPrices('BTC');
    if (btcPrice.success && btcPrice.data && btcPrice.data.length > 0) {
      const price = btcPrice.data[0];
      console.log('  BTC Market Data:');
      console.log(`    Mark Price: $${price.mark}`);
      console.log(`    Oracle Price: $${price.oracle}`);
      console.log(`    Mid Price: $${price.mid}`);
      console.log(`    Funding Rate: ${(parseFloat(price.funding) * 100).toFixed(4)}%`);
      console.log(`    Next Funding: ${(parseFloat(price.next_funding) * 100).toFixed(4)}%`);
      console.log(`    Open Interest: ${price.open_interest}`);
      console.log(`    24h Volume: $${price.volume_24h}`);
    }
  } catch (error) {
    console.error('Error fetching BTC price:', error);
  }

  // 3. Get candle data
  console.log('\n3. Fetching 1-minute candles for BTC (last hour)...');
  try {
    const oneHourAgo = Date.now() - 3600000;
    const candles = await apiClient.getCandleData('BTC', '1m', oneHourAgo);
    
    if (candles.success && candles.data) {
      console.log(`  Retrieved ${candles.data.length} candles`);
      // Display last 5 candles
      const lastFive = candles.data.slice(-5);
      lastFive.forEach((candle) => {
        const time = new Date(candle.t).toLocaleTimeString();
        console.log(`  ${time}: O=${candle.o} H=${candle.h} L=${candle.l} C=${candle.c} V=${candle.v}`);
      });
    }
  } catch (error) {
    console.error('Error fetching candles:', error);
  }

  // 4. Get mark price candles
  console.log('\n4. Fetching mark price candles for ETH...');
  try {
    const oneHourAgo = Date.now() - 3600000;
    const markCandles = await apiClient.getMarkPriceCandleData('ETH', '5m', oneHourAgo);
    
    if (markCandles.success && markCandles.data) {
      console.log(`  Retrieved ${markCandles.data.length} mark price candles`);
      // Display summary
      if (markCandles.data.length > 0) {
        const first = markCandles.data[0];
        const last = markCandles.data[markCandles.data.length - 1];
        console.log(`  Range: $${first.o} → $${last.c}`);
      }
    }
  } catch (error) {
    console.error('Error fetching mark price candles:', error);
  }

  // 5. Get historical funding rates
  console.log('\n5. Fetching historical funding rates for BTC...');
  try {
    const oneDayAgo = Date.now() - 86400000;
    const funding = await apiClient.getHistoricalFunding('BTC', oneDayAgo);
    
    if (funding.success && funding.data) {
      console.log(`  Retrieved ${funding.data.length} funding rate entries`);
      // Display last 3 funding rates
      funding.data.slice(-3).forEach((rate) => {
        const time = new Date(rate.timestamp).toLocaleString();
        console.log(`  ${time}: ${(parseFloat(rate.rate) * 100).toFixed(4)}%`);
      });
    }
  } catch (error) {
    console.error('Error fetching funding rates:', error);
  }

  // 6. Get candles with different intervals
  console.log('\n6. Comparing different candle intervals...');
  const intervals = ['1m', '5m', '15m', '1h'];
  const startTime = Date.now() - 3600000; // Last hour
  
  for (const interval of intervals) {
    try {
      const candles = await apiClient.getCandleData('BTC', interval, startTime);
      if (candles.success && candles.data) {
        console.log(`  ${interval}: ${candles.data.length} candles`);
      }
    } catch (error) {
      console.error(`Error fetching ${interval} candles:`, error);
    }
  }
}

// Run the example
main().catch(console.error);
