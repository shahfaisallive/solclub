import { getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { connection, hostAddress, signer } from '../middlewares/web3Provider.js';
import StakedTokenModel from '../models/StakedToken.js';

// get token account for host wallet
export const getTokenAccount = async (req, res) => {
    console.log("getting token account for host");
    const tokenAddress = new PublicKey(req.params.mintId)

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
    const { mintId, txHash, stakeDuration, ownerAddress, ownerTokenAccount, hostTokenAccount, tokenUri } = req.body

    const stakedToken = await StakedTokenModel.findOne({ txHash: txHash })

    if (stakedToken) {
        res.send({
            status: false,
            msg: "Transaction Hash already exist in database",
            stakedToken
        })
    } else {
        let parsedTx
        try {
            parsedTx = await connection.getParsedTransaction(txHash)

            let transferInstruction = parsedTx.transaction.message.instructions[2]
            if (transferInstruction.parsed.type == "transferChecked") {
                const stakedAt = parsedTx.blockTime
                console.log("staked at......  ", stakedAt);

                let newStake = await StakedTokenModel.create({
                    mintId,
                    txHash,
                    owner: ownerAddress,
                    stakedAt,
                    stakeDuration,
                    ownerTokenAccount,
                    hostTokenAccount,
                    tokenUri,
                })

                newStake.save()

                res.send({
                    status: true,
                    msg: "Token staked successfully",
                    stakedToken: newStake
                })
            } else
                res.send({
                    status: false,
                    msg: "The transaction is not a transfer transaction"
                })

        } catch (error) {
            console.log(error);
            res.send({
                status: false,
                error
            })
        }
    }

}