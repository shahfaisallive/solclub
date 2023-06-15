import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import base58 from 'bs58';
import dotenv from 'dotenv';
dotenv.config();

export const connection = new Connection(
    process.env.RPC_URL
)

export const signer = Keypair.fromSecretKey(base58.decode(process.env.SIGNER_KEY));

export const hostAddress = new PublicKey(process.env.STAKING_HOST)
