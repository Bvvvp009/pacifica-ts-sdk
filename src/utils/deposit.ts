/**
 * Pacifica On-Chain Deposit Utilities
 * Handles Solana blockchain deposit transactions
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { createHash } from 'crypto';

// Pacifica program constants
export const PACIFICA_PROGRAM_ID = new PublicKey('PCFA5iYgmqK6MqPhWNKg7Yv7auX7VZ4Cx7T1eJyrAMH');
export const CENTRAL_STATE = new PublicKey('9Gdmhq4Gv1LnNMp7aiS1HSVd7pNnXNMsbuXALCQRmGjY');
export const PACIFICA_VAULT = new PublicKey('72R843XwZxqWhsJceARQQTTbYtWy6Zw9et2YV4FpRHTa');
export const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

// Deposit instruction uses raw borsh serialization
// Format: discriminator (8 bytes) + amount (u64, 8 bytes)

/**
 * Get discriminator for instruction (first 8 bytes of SHA256("global:instruction_name"))
 */
function getDiscriminator(instructionName: string): Buffer {
  const hash = createHash('sha256').update(`global:${instructionName}`).digest();
  return hash.slice(0, 8);
}

/**
 * Derive event authority PDA
 */
async function getEventAuthority(): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress([Buffer.from('__event_authority')], PACIFICA_PROGRAM_ID);
}

/**
 * Build deposit instruction data
 */
function buildDepositInstructionData(amount: number): Buffer {
  const depositData = {
    amount: BigInt(Math.round(amount * 1_000_000)), // 6 decimals for USDC
  };

  const amountBuffer = Buffer.alloc(8);
  amountBuffer.writeBigUInt64LE(depositData.amount, 0);
  
  // Prepend discriminator
  const discriminator = getDiscriminator('deposit');
  return Buffer.concat([discriminator, amountBuffer]);
}

/**
 * Create deposit transaction
 */
export async function createDepositTransaction(
  keypair: Keypair,
  amount: number,
  rpcUrl: string = 'https://api.mainnet-beta.solana.com'
): Promise<Transaction> {
  const connection = new Connection(rpcUrl, 'confirmed');

  // Get associated token address
  const userUsdcAta = await getAssociatedTokenAddress(USDC_MINT, keypair.publicKey);
  
  // Get event authority PDA
  const [eventAuthority] = await getEventAuthority();

  // Build instruction accounts
  const accounts = [
    {
      pubkey: keypair.publicKey,
      isSigner: true,
      isWritable: true,
    }, // depositor
    {
      pubkey: userUsdcAta,
      isSigner: false,
      isWritable: true,
    }, // depositorUsdcAccount
    {
      pubkey: CENTRAL_STATE,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: PACIFICA_VAULT,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: TOKEN_PROGRAM_ID,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: ASSOCIATED_TOKEN_PROGRAM_ID,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: USDC_MINT,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: eventAuthority,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: PACIFICA_PROGRAM_ID,
      isSigner: false,
      isWritable: false,
    },
  ];

  // Build instruction data
  const instructionData = buildDepositInstructionData(amount);

  // Create instruction
  const instruction = new TransactionInstruction({
    programId: PACIFICA_PROGRAM_ID,
    keys: accounts,
    data: instructionData,
  });

  // Create transaction
  const transaction = new Transaction().add(instruction);

  // Get recent blockhash
  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = keypair.publicKey;

  return transaction;
}

/**
 * Send deposit transaction
 */
export async function sendDepositTransaction(
  keypair: Keypair,
  amount: number,
  rpcUrl?: string
): Promise<string> {
  const connection = new Connection(rpcUrl || 'https://api.mainnet-beta.solana.com', 'confirmed');
  
  const transaction = await createDepositTransaction(keypair, amount, rpcUrl);
  
  // Sign transaction
  transaction.sign(keypair);
  
  // Send transaction
  const signature = await connection.sendRawTransaction(transaction.serialize(), {
    skipPreflight: false,
    maxRetries: 3,
  });
  
  // Wait for confirmation
  await connection.confirmTransaction(signature, 'confirmed');
  
  return signature;
}

/**
 * Convert private key string (base58 or hex) to Keypair
 * Note: Solana uses base58 encoding for keypairs
 */
export function privateKeyToKeypair(privateKey: string): Keypair {
  const cleanKey = privateKey.trim();
  
  // Try hex format first (common in TypeScript/JavaScript)
  if (cleanKey.length === 128 || (cleanKey.startsWith('0x') && cleanKey.length === 130)) {
    try {
      const cleanHex = cleanKey.startsWith('0x') ? cleanKey.slice(2) : cleanKey;
      const secretKey = Buffer.from(cleanHex, 'hex');
      if (secretKey.length === 64) {
        return Keypair.fromSecretKey(secretKey);
      }
    } catch (error) {
      // Fall through to base58
    }
  }
  
  // Try base58
  try {
    const keypair = Keypair.fromSecretKey(
      new Uint8Array(Buffer.from(cleanKey, 'base64'))
    );
    return keypair;
  } catch {
    // Base58 requires additional library
    throw new Error(
      'Invalid private key format. Expected 64-byte hex string (128 chars) or base58 encoded key. ' +
      'For base58 keys, use the solana web3.js Keypair.fromSecretKey() method directly.'
    );
  }
}

/**
 * Helper to create Keypair from various formats
 * Supports:
 * - Uint8Array (64 bytes)
 * - Hex string (128 chars or 0x-prefixed)
 * - Base64 encoded string (88 chars, Solana format)
 */
export function createKeypairFromPrivateKey(privateKey: string | Uint8Array): Keypair {
  if (privateKey instanceof Uint8Array) {
    if (privateKey.length === 64) {
      return Keypair.fromSecretKey(new Uint8Array(privateKey));
    }
    throw new Error('Invalid private key length. Expected 64 bytes.');
  }
  
  if (typeof privateKey === 'string') {
    // Try hex format
    const cleanHex = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
    if (cleanHex.length === 128) {
      try {
        const bytes = Buffer.from(cleanHex, 'hex');
        if (bytes.length === 64) {
          return Keypair.fromSecretKey(bytes);
        }
      } catch {
        // Fall through
      }
    }
    
    // Try base64 (Solana's common format)
    try {
      const bytes = Buffer.from(privateKey, 'base64');
      if (bytes.length === 64) {
        return Keypair.fromSecretKey(bytes);
      }
    } catch {
      // Fall through
    }
    
    // Try base58 format
    try {
      throw new Error('Base58 format detected but requires decoding. Please convert to hex or base64.');
    } catch {
      // Fall through
    }
  }
  
  throw new Error(
    'Invalid private key format. Expected:\n' +
    '- Uint8Array of 64 bytes\n' +
    '- Hex string of 128 characters (or 130 with 0x prefix)\n' +
    '- Base64 encoded string\n' +
    'Note: For base58 Solana keys, use hex/base64 format or decode first.'
  );
}

