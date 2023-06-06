import { PublicKey, Transaction } from "@solana/web3.js";
import nacl from "tweetnacl";

export const verifySignatureMiddleware = async (req, res, next) => {
    const { authMsg, signatureUint8Array, walletAddress } = req.body;
    // console.log(req.body);
    const currentTimeStamp = Date.now()
    // console.log(currentTimeStamp);
    const expirationPeriod = 60 * 1000;
    const signedTimeStamp = authMsg.split('/')[1]
    // console.log(signedTimeStamp);
    if (currentTimeStamp - signedTimeStamp > expirationPeriod) {
        console.log("message signed timestamp has been expired");
        res.send({
            status: false,
            msg: "Timestamp has expired"
        })
    } else {
        try {
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
                res.send({ status: false, msg: 'Invalid signature' });
            }
        } catch (error) {
            console.log("Something is wrong with the data provided for signature verification");
            res.send({
                status: false,
                msg: "Something is wrong with the data provided for signature verification"
            })
        }
    }
};