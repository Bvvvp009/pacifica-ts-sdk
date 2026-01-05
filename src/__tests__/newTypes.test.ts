/**
 * Tests for new SDK type definitions and methods
 */

import type { 
  PriceData, 
  CandleData,
  MarkPriceCandleData,
  TradeHistoryItem, 
  EditOrderParams,
} from '../types';

describe('New SDK Features - Type Safety', () => {
  describe('Market Data Types', () => {
    it('should create valid PriceData object', () => {
      const priceData: PriceData = {
        symbol: 'BTC',
        mark: '50000',
        mid: '50001',
        oracle: '49999',
        funding: '0.0001',
        next_funding: '0.0002',
        open_interest: '1000000',
        volume_24h: '50000000',
        yesterday_price: '49500',
        timestamp: Date.now(),
      };
      expect(priceData.symbol).toBe('BTC');
      expect(priceData.mark).toBe('50000');
    });

    it('should create valid CandleData object', () => {
      const candleData: CandleData = {
        t: 1234567890,
        T: 1234567950,
        s: 'BTC',
        i: '1m',
        o: '50000',
        c: '50100',
        h: '50200',
        l: '49900',
        v: '100',
        n: 10,
      };
      expect(candleData.s).toBe('BTC');
      expect(candleData.i).toBe('1m');
    });

    it('should create valid MarkPriceCandleData object', () => {
      const markCandle: MarkPriceCandleData = {
        t: Date.now(),
        T: Date.now() + 60000,
        s: 'ETH',
        i: '5m',
        o: '3000',
        c: '3010',
        h: '3020',
        l: '2990',
      };
      expect(markCandle.s).toBe('ETH');
    });
  });

  describe('Account History Types', () => {
    it('should create valid TradeHistoryItem object', () => {
      const trade: TradeHistoryItem = {
        history_id: 123,
        order_id: 456,
        symbol: 'BTC',
        amount: '0.5',
        price: '50000',
        entry_price: '49500',
        fee: '10',
        pnl: '250',
        event_type: 'fulfill_maker',
        side: 'buy',
        created_at: Date.now(),
        cause: 'normal',
      };
      expect(trade.symbol).toBe('BTC');
      expect(trade.pnl).toBe('250');
    });
  });

  describe('Order Types', () => {
    it('should create valid EditOrderParams with order_id', () => {
      const editParams: EditOrderParams = {
        order_id: 123456,
        symbol: 'BTC',
        price: '50000',
        amount: '0.5',
      };
      expect(editParams.symbol).toBe('BTC');
      expect(editParams.order_id).toBe(123456);
    });

    it('should create valid EditOrderParams with client_order_id', () => {
      const editParams: EditOrderParams = {
        client_order_id: 'my-order-123',
        symbol: 'ETH',
        price: '3000',
      };
      expect(editParams.client_order_id).toBe('my-order-123');
    });
  });
});
