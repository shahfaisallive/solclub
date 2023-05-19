import { clusterApiUrl, Connection, Keypair, PublicKey } from '@solana/web3.js';
import base58 from 'bs58';

export const connection = new Connection(
    // "https://solana-mainnet.g.alchemy.com/v2/Dsu3oYYI0gI4R4D9LCNPQimGXXOmb6k5"
    "https://solana-devnet.g.alchemy.com/v2/QWm3ITJ7nSGPWrevn6EPYn4KE9I631G7"
)

export const signer = Keypair.fromSecretKey(base58.decode("3kqj5gWhfbcto69KNkKVRZHX9kqFb4r5MW56JwnavGdWPczqLPzpLrU6UKapNYjpBB8D8XM5gvD5JsfvqfsRj6Rq"));

export const hostAddress = new PublicKey("241AWvZbFCRmmVH3wT4SqdZtC4TVJ7FvCViwxYcUg3JT")
