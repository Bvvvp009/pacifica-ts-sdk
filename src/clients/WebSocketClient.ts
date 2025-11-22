/**
 * Pacifica WebSocket Client
 * Handles real-time data streams and WebSocket trading
 */

import * as WS from 'ws';
type WebSocketInstance = InstanceType<typeof WS.default>;
import {
  WebSocketConfig,
  WebSocketMessage,
  OperationType,
  RequestOptions,
} from '../types';
import { buildSignedRequest } from '../utils/signer';
import { logger } from '../utils/logger';

export type WebSocketEventType =
  | 'open'
  | 'close'
  | 'error'
  | 'message'
  | 'reconnect'
  | 'subscription'
  | 'order_update'
  | 'trade'
  | 'ticker'
  | 'orderbook'
  | 'twap_order'
  | 'twap_order_update';

export type WebSocketEventHandler = (data: any) => void;

export class WebSocketClient {
  private ws: WebSocketInstance | null = null;
  private config: Required<WebSocketConfig>;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private eventHandlers: Map<WebSocketEventType, Set<WebSocketEventHandler>> = new Map();
  private isConnecting = false;
  private subscriptions: Set<string> = new Set();
  private privateKey?: string | Uint8Array;
  private accountPublicKey?: string;
  private agentWalletPublicKey?: string;
  private builderCode?: string; // Optional builder code from env or config

  constructor(
    config?: WebSocketConfig & {
      privateKey?: string | Uint8Array;
      accountPublicKey?: string;
      agentWalletPublicKey?: string;
      builderCode?: string; // Optional builder code
    }
  ) {
    this.config = {
      url: config?.url || 'wss://api.pacifica.fi/ws',
      reconnect: config?.reconnect !== false,
      reconnectInterval: config?.reconnectInterval || 5000,
      maxReconnectAttempts: config?.maxReconnectAttempts || 10,
    };

    if (config?.privateKey) {
      this.privateKey = config.privateKey;
      this.accountPublicKey = config.accountPublicKey;
      this.agentWalletPublicKey = config.agentWalletPublicKey;
    }
    
    // Set builder code from config or env (env takes precedence)
    this.builderCode = process.env.BUILDER_CODE || config?.builderCode;
  }

  /**
   * Connect to WebSocket
   */
  async connect(): Promise<void> {
    if (this.ws?.readyState === WS.default.OPEN) {
      return;
    }

    if (this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WS.default(this.config.url);

        this.ws!.on('open', () => {
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          logger.info('WebSocket connected');
          this.emit('open', {});
          
          // Re-subscribe to previous channels
          this.subscriptions.forEach((channel) => {
            this.subscribe(channel);
          });

          resolve();
        });

        this.ws!.on('message', (data: WS.Data) => {
          try {
            const message: WebSocketMessage = JSON.parse(data.toString());
            this.handleMessage(message);
          } catch (error) {
            this.emit('error', { error });
          }
        });

        this.ws!.on('error', (error: Error) => {
          this.isConnecting = false;
          logger.error('WebSocket error:', error);
          this.emit('error', { error });
          reject(error);
        });

        this.ws!.on('close', () => {
          this.isConnecting = false;
          logger.warn('WebSocket closed');
          this.emit('close', {});
          this.handleReconnect();
        });
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.subscriptions.clear();
  }

  /**
   * Subscribe to a channel
   * 
   * Common channels:
   * - 'prices' - Subscribe to all price updates
   * - 'ticker:BTC' - Subscribe to BTC ticker updates
   * - 'orderbook:BTC' - Subscribe to BTC orderbook updates
   * - 'trades:BTC' - Subscribe to BTC trades
   */
  subscribe(channel: string): void {
    if (!channel || typeof channel !== 'string') {
      throw new Error('Channel must be a non-empty string');
    }

    if (!this.ws || this.ws.readyState !== 1) { // WebSocket.OPEN = 1
      this.subscriptions.add(channel);
      return;
    }

    const message: WebSocketMessage = {
      type: 'subscribe',
      channel,
    };

    this.send(message);
    this.subscriptions.add(channel);
    this.emit('subscription', { channel });
  }
  
  /**
   * Subscribe to ticker updates for a market
   * Convenience method for subscribing to ticker data
   */
  subscribeToTicker(market: string): void {
    this.subscribe(`ticker:${market}`);
  }
  
  /**
   * Subscribe to orderbook updates for a market
   * Convenience method for subscribing to orderbook data
   */
  subscribeToOrderbook(market: string): void {
    this.subscribe(`orderbook:${market}`);
  }
  
  /**
   * Subscribe to trades for a market
   * Convenience method for subscribing to trades data
   */
  subscribeToTrades(market: string): void {
    this.subscribe(`trades:${market}`);
  }
  
  /**
   * Subscribe to all price updates
   * Convenience method for subscribing to all market prices
   */
  subscribeToPrices(): void {
    this.subscribe('prices');
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channel: string): void {
    if (!this.ws || this.ws.readyState !== 1) { // WebSocket.OPEN = 1
      this.subscriptions.delete(channel);
      return;
    }

    const message: WebSocketMessage = {
      type: 'unsubscribe',
      channel,
    };

    this.send(message);
    this.subscriptions.delete(channel);
  }

  /**
   * Send a signed operation via WebSocket
   */
  async sendSignedOperation(
    operation: OperationType,
    data: Record<string, any>,
    options?: RequestOptions
  ): Promise<void> {
    if (!this.privateKey) {
      throw new Error('Private key required for signed operations');
    }

    if (!this.ws || this.ws.readyState !== 1) { // WebSocket.OPEN = 1
      throw new Error('WebSocket not connected');
    }

    const publicKey = options?.agent_wallet || this.agentWalletPublicKey || this.accountPublicKey;
    
    // Merge builder_code if available and not already in data
    const dataWithBuilder = this.builderCode && !data.builder_code
      ? { ...data, builder_code: this.builderCode }
      : data;
    
    const signedRequest = await buildSignedRequest(
      operation,
      dataWithBuilder,
      this.privateKey,
      publicKey || this.accountPublicKey
    );

    const message: WebSocketMessage = {
      type: 'operation',
      ...signedRequest,
    };

    if (options?.agent_wallet || this.agentWalletPublicKey) {
      (message as any).agent_wallet = options?.agent_wallet || this.agentWalletPublicKey;
    }

    this.send(message);
  }

  /**
   * Create market order via WebSocket
   */
  async createMarketOrder(
    market: string,
    side: 'buy' | 'sell',
    size: string,
    options?: RequestOptions
  ): Promise<void> {
    return this.sendSignedOperation(
      'create_market_order',
      { market, side, size, order_type: 'market' },
      options
    );
  }

  /**
   * Create limit order via WebSocket
   */
  async createLimitOrder(
    market: string,
    side: 'buy' | 'sell',
    size: string,
    price: string,
    options?: RequestOptions
  ): Promise<void> {
    return this.sendSignedOperation(
      'create_order',
      { market, side, size, price, order_type: 'limit' },
      options
    );
  }

  /**
   * Create stop order via WebSocket
   */
  async createStopOrder(
    market: string,
    side: 'buy' | 'sell',
    size: string,
    stopPrice: string,
    price?: string,
    options?: RequestOptions
  ): Promise<void> {
    return this.sendSignedOperation(
      'create_stop_order',
      { market, side, size, stop_price: stopPrice, price },
      options
    );
  }

  /**
   * Set position take-profit/stop-loss via WebSocket
   */
  async setPositionTPSL(
    market: string,
    takeProfit?: string,
    stopLoss?: string,
    options?: RequestOptions
  ): Promise<void> {
    return this.sendSignedOperation(
      'set_position_tpsl',
      { market, take_profit: takeProfit, stop_loss: stopLoss },
      options
    );
  }

  /**
   * Cancel an order via WebSocket
   */
  async cancelOrder(
    orderId: string | number,
    market?: string,
    options?: RequestOptions
  ): Promise<void> {
    const data: Record<string, any> = { order_id: orderId };
    if (market) data.market = market;
    return this.sendSignedOperation('cancel_order', data, options);
  }

  /**
   * Close a position via WebSocket (cancel position)
   */
  async closePosition(
    market: string,
    size?: string,
    options?: RequestOptions
  ): Promise<void> {
    const data: Record<string, any> = { market };
    if (size) data.size = size;
    return this.sendSignedOperation('close_position', data, options);
  }

  /**
   * Modify position via WebSocket (update leverage, margin mode, etc.)
   */
  async modifyPosition(
    market: string,
    leverage?: number,
    marginMode?: 'isolated' | 'cross',
    options?: RequestOptions
  ): Promise<void> {
    const data: Record<string, any> = { market };
    if (leverage !== undefined) data.leverage = leverage;
    if (marginMode) data.margin_mode = marginMode;
    return this.sendSignedOperation('modify_position', data, options);
  }

  /**
   * Subscribe to TWAP orders for an account
   */
  subscribeToTWAPOrders(account: string): void {
    if (!this.ws || this.ws.readyState !== 1) { // WebSocket.OPEN = 1
      const channel = `twap_orders:${account}`;
      this.subscriptions.add(channel);
      return;
    }

    const message = {
      method: 'subscribe',
      params: {
        source: 'account_twap_orders',
        account,
      },
    };

    this.send(message as any);
    this.subscriptions.add(`twap_orders:${account}`);
    this.emit('subscription', { channel: `twap_orders:${account}` });
  }

  /**
   * Subscribe to TWAP order updates for an account
   */
  subscribeToTWAPOrderUpdates(account: string): void {
    if (!this.ws || this.ws.readyState !== 1) { // WebSocket.OPEN = 1
      const channel = `twap_order_updates:${account}`;
      this.subscriptions.add(channel);
      return;
    }

    const message = {
      method: 'subscribe',
      params: {
        source: 'account_twap_order_updates',
        account,
      },
    };

    this.send(message as any);
    this.subscriptions.add(`twap_order_updates:${account}`);
    this.emit('subscription', { channel: `twap_order_updates:${account}` });
  }

  /**
   * Add event listener
   */
  on(event: WebSocketEventType, handler: WebSocketEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * Remove event listener
   */
  off(event: WebSocketEventType, handler: WebSocketEventHandler): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  /**
   * Get connection state
   */
  getState(): 'connecting' | 'open' | 'closing' | 'closed' {
    if (!this.ws) return 'closed';
    switch (this.ws.readyState) {
      case 0: // CONNECTING
        return 'connecting';
      case 1: // OPEN
        return 'open';
      case 2: // CLOSING
        return 'closing';
      default:
        return 'closed';
    }
  }

  private send(message: WebSocketMessage): void {
    if (!this.ws || this.ws.readyState !== 1) { // WebSocket.OPEN = 1
      throw new Error('WebSocket not connected');
    }
    this.ws.send(JSON.stringify(message));
  }

  private handleMessage(message: WebSocketMessage): void {
    this.emit('message', message);

    // Route specific message types
    if (message.type === 'order_update') {
      this.emit('order_update', message.data);
    } else if (message.type === 'trade') {
      this.emit('trade', message.data);
    } else if (message.type === 'ticker') {
      this.emit('ticker', message.data);
    } else if (message.type === 'orderbook') {
      this.emit('orderbook', message.data);
    } else if (message.type === 'account_twap_orders' || (message as any).source === 'account_twap_orders') {
      this.emit('twap_order', message.data || message);
    } else if (message.type === 'account_twap_order_updates' || (message as any).source === 'account_twap_order_updates') {
      this.emit('twap_order_update', message.data || message);
    }
  }

  private emit(event: WebSocketEventType, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          logger.error(`Error in ${event} handler:`, error);
        }
      });
    }
  }

  private handleReconnect(): void {
    if (!this.config.reconnect) {
      return;
    }

    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.emit('error', { error: new Error('Max reconnect attempts reached') });
      return;
    }

    this.reconnectAttempts++;
    logger.info(`WebSocket reconnecting (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);
    this.emit('reconnect', { attempt: this.reconnectAttempts });

    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      60000
    );
    const cappedDelay = Math.min(delay, 60000);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        logger.error('WebSocket reconnection failed:', error);
        this.emit('error', { error });
      });
    }, cappedDelay);
  }
}


