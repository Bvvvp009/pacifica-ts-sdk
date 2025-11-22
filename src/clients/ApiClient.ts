/**
 * Pacifica ApiClient
 * Handles all read-only GET requests that don't require signing
 */

import { ApiResponse, MarketInfo, Ticker, OrderBook, Trade, Order, TWAPOrder, Position, PacificaConfig } from '../types';
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
   */
  async getPosition(market: string, account?: string): Promise<ApiResponse<Position>> {
    const params: Record<string, string> | undefined = account ? { account } : undefined;
    return this.get<Position>(`/positions/${market}`, params);
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
}

