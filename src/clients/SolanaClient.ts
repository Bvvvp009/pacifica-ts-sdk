/**
 * Pacifica Solana Client
 * Handles on-chain Solana operations (deposits, etc.)
 */

import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import {
  createDepositTransaction,
  sendDepositTransaction,
  createKeypairFromPrivateKey,
  PACIFICA_PROGRAM_ID,
  CENTRAL_STATE,
  PACIFICA_VAULT,
  USDC_MINT,
} from '../utils/deposit';

export interface SolanaClientConfig {
  rpcUrl?: string;
  commitment?: 'processed' | 'confirmed' | 'finalized';
}

export class SolanaClient {
  private connection: Connection;
  private keypair?: Keypair;
  private rpcUrl: string;
  private commitment: 'processed' | 'confirmed' | 'finalized';

  constructor(
    privateKey?: string | Uint8Array,
    config?: SolanaClientConfig
  ) {
    this.rpcUrl = config?.rpcUrl || 'https://api.mainnet-beta.solana.com';
    this.commitment = config?.commitment || 'confirmed';
    this.connection = new Connection(this.rpcUrl, this.commitment);

    if (privateKey) {
      this.keypair = createKeypairFromPrivateKey(privateKey);
    }
  }

  /**
   * Set private key for transactions
   */
  setPrivateKey(privateKey: string | Uint8Array): void {
    this.keypair = createKeypairFromPrivateKey(privateKey);
  }

  /**
   * Get Solana connection
   */
  getConnection(): Connection {
    return this.connection;
  }

  /**
   * Deposit funds on-chain
   * Minimum amount is 10 USDC
   */
  async deposit(amount: number, options?: { rpcUrl?: string }): Promise<string> {
    if (!this.keypair) {
      throw new Error('Private key required for deposit. Use setPrivateKey() or provide in constructor.');
    }

    if (amount < 10) {
      throw new Error('Minimum deposit amount is 10 USDC');
    }

    const rpcUrl = options?.rpcUrl || this.rpcUrl;
    return sendDepositTransaction(this.keypair, amount, rpcUrl);
  }

  /**
   * Create deposit transaction without sending
   */
  async createDepositTransaction(amount: number, options?: { rpcUrl?: string }): Promise<Transaction> {
    if (!this.keypair) {
      throw new Error('Private key required for deposit transaction.');
    }

    if (amount < 10) {
      throw new Error('Minimum deposit amount is 10 USDC');
    }

    const rpcUrl = options?.rpcUrl || this.rpcUrl;
    return createDepositTransaction(this.keypair, amount, rpcUrl);
  }

  /**
   * Get account balance
   */
  async getBalance(publicKey: PublicKey): Promise<number> {
    const balance = await this.connection.getBalance(publicKey);
    return balance / 1e9; // Convert lamports to SOL
  }

  /**
   * Get token balance
   */
  async getTokenBalance(tokenAccount: PublicKey): Promise<number> {
    const balance = await this.connection.getTokenAccountBalance(tokenAccount);
    return parseFloat(balance.value.amount) / Math.pow(10, balance.value.decimals);
  }

  // Export constants
  static readonly PROGRAM_ID = PACIFICA_PROGRAM_ID;
  static readonly CENTRAL_STATE = CENTRAL_STATE;
  static readonly VAULT = PACIFICA_VAULT;
  static readonly USDC_MINT = USDC_MINT;
}

