import { PublicKey, Transaction } from "@solana/web3.js";
import nacl from "tweetnacl";

export const verifySignatureMiddleware = async (req, res, next) => {
    const { authMsg, signatureUint8Array, walletAddress } = req.body;

    const signature = new Uint8Array(signatureUint8Array.data);

    const publicKey = new PublicKey(walletAddress).toBuffer()

    const message = new TextEncoder().encode(authMsg)

    // Verify the signature
    const isValidSignature = await nacl.sign.detached.verify(
        message,
        signature,
        publicKey
    );
    if (isValidSignature) {
        console.log("Signature is Valid");
        next();
    } else {
        console.log("Signature is Not Valid");
        // Signature is not valid, return an error response
        res.status(400).json({ error: 'Invalid signature' });
    }
};