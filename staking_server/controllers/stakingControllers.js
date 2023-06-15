import { getOrCreateAssociatedTokenAccount, transfer } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { claimReward, getTokenAccount } from '../middlewares/utils.js';
import { connection, hostAddress, signer } from '../middlewares/web3Provider.js';
import StakedTokenModel from '../models/StakedToken.js';
import UnstakedTokenModel from '../models/UnstakedToken.js';
import { Metaplex, keypairIdentity } from "@metaplex-foundation/js"

const metaplex = Metaplex.make(connection)

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
export const getHostTokenAccount = async (req, res) => {
    console.log("getting token account in host for  :", req.params.mintId);
    const tokenAddress = req.params.mintId
    // console.log(tokenAddress);
    try {
        const tokenAccount = await getTokenAccount(tokenAddress, process.env.STAKING_HOST)

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
    const { mintId, txHash, stakeDuration } = req.body
    console.log(req.body);
    const stakedToken = await StakedTokenModel.findOne({ txHash: txHash, mintId: mintId })
    const unstakedToken = await UnstakedTokenModel.findOne({ mintId: mintId })

    if (stakedToken) {
        res.send({
            status: false,
            msg: "Transaction Hash already exist in database",
            stakedToken
        })
    } else {
        const transactAndSave = async () => {
            try {
                let parsedTx = await connection.getParsedTransaction(txHash, "confirmed")
                // console.log("tx obj: ", parsedTx);
                if (parsedTx) {
                    if (parsedTx.meta.innerInstructions[0].instructions[1].program == "spl-token" && parsedTx.meta.innerInstructions[0].instructions[1].parsed.type == "transfer") {
                        const rewardAmount = (stakeDuration / 86400) * process.env.REWARD_RATE_DAY

                        let newStake = await StakedTokenModel.create({
                            mintId,
                            txHash,
                            owner: parsedTx.meta.innerInstructions[0].instructions[1].parsed.info.signers[0],
                            stakedAt: parsedTx.blockTime,
                            stakeDuration: stakeDuration / 3600, //TODO: remove this temp formula
                            rewardAmount,
                            ownerTokenAccount: parsedTx.meta.innerInstructions[0].instructions[1].parsed.info.source,
                            hostTokenAccount: parsedTx.meta.innerInstructions[0].instructions[1].parsed.info.destination,
                        })

                        newStake.save()
                        if (unstakedToken) {
                            unstakedToken.deleteOne()
                        }

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
                } else {
                    transactAndSave()
                }
            } catch (error) {
                console.log(error);
                res.send({
                    status: false,
                    msg: "Unknown issue occurred",
                    error
                })
            }
        }
        transactAndSave()
    }

}


// Controllet to handle unstaking NFT
export const unstakeController = async (req, res) => {
    console.log("unstake Controller called");
    const { mintId, walletAddress } = req.body
    // console.log(req.body);

    const stakedToken = await StakedTokenModel.findOne({ mintId: mintId })
    console.log(stakedToken);
    // TODO: create another utility function to check if the token is present in the host wallet as well or not to ensure transparency
    if (!stakedToken || stakedToken.owner != walletAddress) {
        console.log("Something is wrong, either token is not staked or you are not the reak stakeholder");
        res.send({
            status: false,
            msg: "Something is wrong, either token is not staked or you are not the reak stakeholder",
        })
    } else {
        console.log(stakedToken);
        const timeStamp = Math.floor(new Date().getTime() / 1000);
        console.log(timeStamp);

        if (timeStamp > (stakedToken.stakedAt + stakedToken.stakeDuration)) {
            const toTokenAccount = new PublicKey(stakedToken.ownerTokenAccount)
            const fromTokenAccount = new PublicKey(stakedToken.hostTokenAccount)

            let signature
            try {
                const mintAddress = new PublicKey(mintId)
                const feePayer = {
                    publicKey: hostAddress,
                    signTransaction: async (tx) => tx,
                    signMessage: async (msg) => msg,
                    signAllTransactions: async (txs) => txs,
                };

                metaplex.use(keypairIdentity(signer))
                const nftToUnstake = await metaplex.nfts().findByMint({ mintAddress });
                // console.log(nftToUnstake);
                const unstakeTxObj = metaplex.nfts().builders().transfer({
                    nftOrSft: nftToUnstake,
                    fromOwner: hostAddress,
                    toOwner: new PublicKey(walletAddress),
                    authority: feePayer,
                });
                const blockhash = await connection.getLatestBlockhash();

                const unstakeTx = unstakeTxObj.toTransaction(blockhash)
                unstakeTx.feePayer = hostAddress
                unstakeTx.sign(signer)
                console.log("unstakeTx", unstakeTx);
                signature = await connection.sendRawTransaction(unstakeTx.serialize())
                console.log("unstakeHash: ", txHash)
            } catch (error) {
                console.log(error);
                signature = null
                console.log("unstake transaction failed");
            }
            if (signature) {
                try {
                    const rewardSignature = await claimReward(stakedToken)

                    let parsedTx = await connection.getParsedTransaction(signature, 'confirmed')

                    let unstakedToken = await UnstakedTokenModel.create({
                        mintId,
                        unstakedAt: parsedTx.blockTime,
                        rewardClaimed: rewardSignature ? true : false
                    })

                    unstakedToken.save()
                    stakedToken.deleteOne()
                    res.send({
                        status: true,
                        msg: "Token unstaked successfuly",
                        signature,
                        rewardSignature
                    })
                } catch (error) {
                    res.send({
                        status: false,
                        msg: "Failed to unstake token"
                    })
                }
            } else {
                res.send({
                    status: false,
                    msg: "Unstake transaction got failed"
                })
            }
        } else {
            res.send({
                status: false,
                msg: "Token is locked yet. Timestamp not reached",
            })
        }
    }

}