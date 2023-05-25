import { getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { connection, hostAddress, signer } from '../middlewares/web3Provider.js';
import StakedTokenModel from '../models/StakedToken.js';
import UnstakedTokenModel from '../models/UnstakedToken.js';

// get transaction details by hash
export const getTxDetails = async (req, res) => {
    console.log("getting tx details");
    let parsedTx
    try {
        parsedTx = await connection.getParsedTransaction(req.params.hash)

        res.send({
            status: true,
            txObj: parsedTx,
            msg: "tx details fetched successfully"
        })
    } catch (error) {
        console.error(error);
        res.send({
            status: false,
            msg: "Unable to fetch tx details"
        })
    }
}


// get token account for host wallet
export const getTokenAccount = async (req, res) => {
    console.log("getting token account in host for  :", req.params.mintId);
    const tokenAddress = new PublicKey(req.params.mintId)
    console.log(tokenAddress);
    try {
        const tokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            signer,
            tokenAddress,
            hostAddress,
        );

        res.send({
            status: true,
            tokenAccount: tokenAccount.address.toBase58(),
            msg: "token account fetched successfully"
        })
    } catch (error) {
        console.error(error);
        res.send({
            status: false,
            msg: "Unable to fetch token account for given token"
        })
    }
}

// Get create stak in the collection
export const stakeController = async (req, res) => {
    console.log("stake controller called")
    const { mintId, txHash, stakeDuration, ownerAddress, ownerTokenAccount, hostTokenAccount } = req.body
    console.log(req.body);
    const stakedToken = await StakedTokenModel.findOne({ txHash: txHash, mintId: mintId })

    if (stakedToken) {
        res.send({
            status: false,
            msg: "Transaction Hash already exist in database",
            stakedToken
        })
    } else {
        try {
            let parsedTx = await connection.getParsedTransaction(txHash, 'confirmed')

            if (parsedTx.transaction.message.instructions[0].parsed.type == "transfer") {

                let newStake = await StakedTokenModel.create({
                    mintId,
                    txHash,
                    owner: parsedTx.transaction.message.instructions[0].parsed.info.authority,
                    stakedAt: parsedTx.blockTime,
                    stakeDuration,
                    ownerTokenAccount: parsedTx.transaction.message.instructions[0].parsed.info.destination,
                    hostTokenAccount: parsedTx.transaction.message.instructions[0].parsed.info.source,
                })

                newStake.save()

                console.log(`${mintId} Staked Successfully`);
                res.send({
                    status: true,
                    msg: "Token staked successfully",
                    stakedToken: newStake
                })
            } else {
                res.send({
                    status: false,
                    msg: "The transaction is not a transfer transaction"
                })
            }
        } catch (error) {
            console.log(error);
            res.send({
                status: false,
                error
            })
        }
    }

}


// Controllet to handle unstaking NFT
export const unstakeController = async (req, res) => {
    console.log("unstake Controller called");
    const { mintId } = req.body

    const stakedToken = await StakedTokenModel.findOne({ mintId: mintId })

    // TODO: create another utility function to check if the token is present in the host wallet as well or not to ensure transparency
    if (!stakedToken) {
        res.send({
            status: false,
            msg: "This token has not been staked",
        })
    } else {
        const timeStamp = Math.floor(new Date().getTime() / 1000);
        console.log(timeStamp);
        if (timeStamp > (stakedToken.stakedAt + stakedToken.stakeDuration)) {

            const toTokenAccount = stakedToken.ownerTokenAccount
            const fromTokenAccount = stakedToken.hostTokenAccount

            let signature
            try {
                signature = await transfer(
                    connection,
                    signer,
                    fromTokenAccount,
                    toTokenAccount,
                    hostAddress,
                    1
                );
            } catch (error) {
                signature = null
                console.log("transfer transaction failed");
            }
            if (signature) {
                try {
                    let parsedTx = await connection.getParsedTransaction(signature, 'confirmed')

                    let unstakedToken = await UnstakedTokenModel.create({
                        mintId,
                        unstakedAt: parsedTx.blockTime
                    })

                    unstakedToken.save()
                    res.send({
                        status: true,
                        msg: "Token unstaked successfuly"
                    })
                } catch (error) {
                    res.send({
                        status: false,
                        msg: "Failed to unstake token"
                    })
                }
            }
        } else {
            res.send({
                status: false,
                msg: "Token is locked yet. Timestamp not reached",
            })
        }
    }

}