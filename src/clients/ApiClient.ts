/**
 * Pacifica ApiClient
 * Handles all read-only GET requests that don't require signing
 */

import { 
  ApiResponse, 
  PaginatedResponse,
  MarketInfo, 
  Ticker, 
  OrderBook, 
  Trade, 
  Order, 
  TWAPOrder, 
  Position, 
  PacificaConfig,
  PriceData,
  CandleData,
  MarkPriceCandleData,
  HistoricalFunding,
  TradeHistoryItem,
  FundingHistoryItem,
  AccountEquityHistoryItem,
  AccountSettings,
} from '../types';
import { BaseClient } from './BaseClient';

export class ApiClient extends BaseClient {
  constructor(config?: PacificaConfig) {
    super(config?.baseUrl, config?.timeout, config);
  }
  /**
   * Get market information
   * Market data is available via WebSocket.
   */
  async getMarketInfo(market?: string): Promise<ApiResponse<MarketInfo[]>> {
    const endpoint = market 
      ? `/markets/${market}`
      : '/markets';
    try {
      return await this.get<MarketInfo[]>(endpoint);
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error(
          'Market data endpoints are not available via REST API. ' +
          'Please use WebSocketClient.subscribe("prices") for real-time market data.'
        );
      }
      throw error;
    }
  }

  /**
   * Get ticker information
   * Market data is available via WebSocket.
   */
  async getTicker(market: string): Promise<ApiResponse<Ticker>> {
    try {
      return await this.get<Ticker>(`/ticker/${market}`);
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error(
          'Ticker endpoints are not available via REST API. ' +
          `Please use WebSocketClient.subscribe('ticker:${market}') for real-time ticker data.`
        );
      }
      throw error;
    }
  }

  /**
   * Get all tickers
   * Market data is available via WebSocket.
   */
  async getTickers(): Promise<ApiResponse<Ticker[]>> {
    try {
      return await this.get<Ticker[]>('/tickers');
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error(
          'Ticker endpoints are not available via REST API. ' +
          'Please use WebSocketClient.subscribe("prices") for real-time ticker data.'
        );
      }
      throw error;
    }
  }

  /**
   * Get order book
   * Market data is available via WebSocket.
   */
  async getOrderBook(market: string, depth?: number): Promise<ApiResponse<OrderBook>> {
    const params: Record<string, string> | undefined = depth ? { depth: depth.toString() } : undefined;
    try {
      return await this.get<OrderBook>(`/orderbook/${market}`, params);
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error(
          'Orderbook endpoints are not available via REST API. ' +
          `Please use WebSocketClient.subscribe('orderbook:${market}') for real-time orderbook data.`
        );
      }
      throw error;
    }
  }

  /**
   * Get recent trades
   * Market data is available via WebSocket.
   */
  async getTrades(market: string, limit?: number): Promise<ApiResponse<Trade[]>> {
    const params: Record<string, string> | undefined = limit ? { limit: limit.toString() } : undefined;
    try {
      return await this.get<Trade[]>(`/trades/${market}`, params);
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error(
          'Trades endpoints are not available via REST API. ' +
          `Please use WebSocketClient.subscribe('trades:${market}') for real-time trades data.`
        );
      }
      throw error;
    }
  }

  /**
   * Get account balance
   */
  async getBalance(account?: string, currency?: string): Promise<ApiResponse> {
    if (currency) {
      const endpoint = `/account/balance/${currency}`;
      const params: Record<string, string> | undefined = account ? { account } : undefined;
      return this.get(endpoint, params);
    }
    if (account) {
      return this.getAccountInfo(account);
    }
    throw new Error('Account parameter is required for getBalance()');
  }

  /**
   * Get open orders (all orders for account)
   */
  async getOpenOrders(account: string, market?: string): Promise<ApiResponse<Order[]>> {
    const params: Record<string, string> = { account };
    if (market) params.market = market;
    const response = await this.get<Order[]>('/orders', params);
    if (response.success && Array.isArray(response.data)) {
      const orders = response.data;
      const openOrders = orders.filter((order: any) => {
        const status = order.status?.toLowerCase() || '';
        return status === 'open' || status === 'pending' || !status || 
               (order.filled_amount === '0' || order.filled_amount === 0);
      });
      return { ...response, data: openOrders as Order[] };
    }
    return response;
  }

  /**
   * Get order history
   */
  async getOrderHistory(account: string, market?: string, limit?: number): Promise<ApiResponse<Order[]>> {
    const params: Record<string, string> = { account };
    if (limit) params.limit = limit.toString();
    return this.get<Order[]>('/orders/history', params);
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<ApiResponse<Order>> {
    return this.get<Order>(`/orders/${orderId}`);
  }

  /**
   * Get positions
   */
  async getPositions(account?: string, market?: string): Promise<ApiResponse<Position[]>> {
    const params: Record<string, string> = {};
    if (account) params.account = account;
    if (market) params.market = market;
    return this.get<Position[]>('/positions', params);
  }

  /**
   * Get position for a specific market
   * Note: This filters client-side from getPositions() as the API doesn't have a single-position endpoint
   */
  async getPosition(market: string, account?: string): Promise<ApiResponse<Position>> {
    const result = await this.getPositions(account, market);
    if (result.success && result.data && Array.isArray(result.data)) {
      const position = result.data.find((p: Position) => p.market === market);
      if (position) {
        return { ...result, data: position };
      }
      return {
        success: false,
        data: undefined,
        error: {
          code: 'NOT_FOUND',
          message: `Position not found for market: ${market}`,
        },
      };
    }
    return result as any;
  }

  /**
   * Get account information
   */
  async getAccountInfo(account: string): Promise<ApiResponse> {
    if (!account) {
      throw new Error('Account parameter is required for getAccountInfo()');
    }
    const params: Record<string, string> = { account };
    return this.get('/account', params);
  }

  /**
   * Get account balance history
   */
  async getAccountHistory(account: string, limit?: number, cursor?: string): Promise<ApiResponse> {
    if (!account) {
      throw new Error('Account parameter is required for getAccountHistory()');
    }
    const params: Record<string, string> = { account };
    if (limit) params.limit = limit.toString();
    if (cursor) params.cursor = cursor;
    return this.get('/account/balance/history', params);
  }

  // TWAP Order Methods

  /**
   * Get open TWAP orders for an account
   */
  async getOpenTWAPOrders(account: string): Promise<ApiResponse<TWAPOrder[]>> {
    return this.get<TWAPOrder[]>('/orders/twap', { account });
  }

  /**
   * Get TWAP order history for an account
   */
  async getTWAPOrderHistory(account: string): Promise<ApiResponse<TWAPOrder[]>> {
    return this.get<TWAPOrder[]>('/orders/twap/history', { account });
  }

  /**
   * Get TWAP order history by order ID
   */
  async getTWAPOrderHistoryById(orderId: string | number): Promise<ApiResponse<TWAPOrder>> {
    return this.get<TWAPOrder>('/orders/twap/history_by_id', { order_id: orderId.toString() });
  }

  // Market Data Methods

  /**
   * Get price information for all symbols
   * Includes mark prices, funding rates, and market statistics
   */
  async getPrices(symbol?: string): Promise<ApiResponse<PriceData[]>> {
    const endpoint = symbol ? `/info/prices?symbol=${symbol}` : '/info/prices';
    return this.get<PriceData[]>(endpoint);
  }

  /**
   * Get candle/kline data for a specific market
   * @param symbol Market symbol (e.g., 'BTC', 'ETH')
   * @param interval Candle interval: '1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'
   * @param startTime Start time in milliseconds
   * @param endTime End time in milliseconds (optional)
   * @param limit Number of candles to return (optional)
   */
  async getCandleData(
    symbol: string,
    interval: string,
    startTime: number,
    endTime?: number,
    limit?: number
  ): Promise<ApiResponse<CandleData[]>> {
    const params: Record<string, string> = {
      symbol,
      interval,
      start_time: startTime.toString(),
    };
    if (endTime) params.end_time = endTime.toString();
    if (limit) params.limit = limit.toString();
    return this.get<CandleData[]>('/kline', params);
  }

  /**
   * Get mark price candle data for a specific market
   * @param symbol Market symbol (e.g., 'BTC', 'ETH')
   * @param interval Candle interval
   * @param startTime Start time in milliseconds
   * @param endTime End time in milliseconds (optional)
   * @param limit Number of candles to return (optional)
   */
  async getMarkPriceCandleData(
    symbol: string,
    interval: string,
    startTime: number,
    endTime?: number,
    limit?: number
  ): Promise<ApiResponse<MarkPriceCandleData[]>> {
    const params: Record<string, string> = {
      symbol,
      interval,
      start_time: startTime.toString(),
    };
    if (endTime) params.end_time = endTime.toString();
    if (limit) params.limit = limit.toString();
    return this.get<MarkPriceCandleData[]>('/kline/mark', params);
  }

  /**
   * Get historical funding rates for a market
   * @param symbol Market symbol (optional - if not provided, returns all markets)
   * @param startTime Start time in milliseconds (optional)
   * @param endTime End time in milliseconds (optional)
   * @param limit Number of results to return (optional)
   */
  async getHistoricalFunding(
    symbol?: string,
    startTime?: number,
    endTime?: number,
    limit?: number
  ): Promise<ApiResponse<HistoricalFunding[]>> {
    const params: Record<string, string> = {};
    if (symbol) params.symbol = symbol;
    if (startTime) params.start_time = startTime.toString();
    if (endTime) params.end_time = endTime.toString();
    if (limit) params.limit = limit.toString();
    return this.get<HistoricalFunding[]>('/funding_rate/history', params);
  }

  // Account History Methods

  /**
   * Get trade history for an account
   * @param account Account public key
   * @param symbol Market symbol (optional)
   * @param startTime Start time in milliseconds (optional)
   * @param endTime End time in milliseconds (optional)
   * @param limit Number of results to return (optional, default 100)
   * @param cursor Pagination cursor (optional)
   */
  async getTradeHistory(
    account: string,
    symbol?: string,
    startTime?: number,
    endTime?: number,
    limit?: number,
    cursor?: string
  ): Promise<PaginatedResponse<TradeHistoryItem>> {
    if (!account) {
      throw new Error('Account parameter is required for getTradeHistory()');
    }
    const params: Record<string, string> = { account };
    if (symbol) params.symbol = symbol;
    if (startTime) params.start_time = startTime.toString();
    if (endTime) params.end_time = endTime.toString();
    if (limit) params.limit = limit.toString();
    if (cursor) params.cursor = cursor;
    return this.get<PaginatedResponse<TradeHistoryItem>>('/trades/history', params) as any;
  }

  /**
   * Get funding payment history for an account
   * @param account Account public key
   * @param symbol Market symbol (optional)
   * @param limit Number of results to return (optional, default 100)
   * @param cursor Pagination cursor (optional)
   */
  async getFundingHistory(
    account: string,
    symbol?: string,
    limit?: number,
    cursor?: string
  ): Promise<PaginatedResponse<FundingHistoryItem>> {
    if (!account) {
      throw new Error('Account parameter is required for getFundingHistory()');
    }
    const params: Record<string, string> = { account };
    if (symbol) params.symbol = symbol;
    if (limit) params.limit = limit.toString();
    if (cursor) params.cursor = cursor;
    return this.get<PaginatedResponse<FundingHistoryItem>>('/funding/history', params) as any;
  }

  /**
   * Get account equity history
   * @param account Account public key
   * @param timeRange Time range (e.g., '1d', '7d', '30d', '90d') - defaults to '7d'
   * @param startTime Start time in milliseconds (optional, overrides timeRange if provided)
   * @param endTime End time in milliseconds (optional)
   * @param limit Number of results to return (optional)
   */
  async getAccountEquityHistory(
    account: string,
    timeRangeOrStartTime?: string | number,
    endTime?: number,
    limit?: number
  ): Promise<ApiResponse<AccountEquityHistoryItem[]>> {
    if (!account) {
      throw new Error('Account parameter is required for getAccountEquityHistory()');
    }
    const params: Record<string, string> = { account };
    
    // If first param is a number, treat as startTime for backwards compatibility
    if (typeof timeRangeOrStartTime === 'number') {
      params.start_time = timeRangeOrStartTime.toString();
      if (endTime) params.end_time = endTime.toString();
    } else if (typeof timeRangeOrStartTime === 'string') {
      // String is treated as time_range
      params.time_range = timeRangeOrStartTime;
    } else {
      // Default to 7d if nothing specified
      params.time_range = '7d';
    }
    
    if (limit) params.limit = limit.toString();
    return this.get<AccountEquityHistoryItem[]>('/portfolio', params);
  }

  /**
   * Get account settings (margin mode and leverage per symbol)
   * Returns only symbols with non-default settings
   * @param account Account public key
   */
  async getAccountSettings(account: string): Promise<ApiResponse<AccountSettings[]>> {
    if (!account) {
      throw new Error('Account parameter is required for getAccountSettings()');
    }
    return this.get<AccountSettings[]>('/account/settings', { account });
  }
}

