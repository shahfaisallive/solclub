import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { connection, hostAddress, signer } from "./web3Provider.js";

// Get token account of any spl-token in any wallet
export const getTokenAccount = async (_tokenAddress, _walletAddress) => {
    const tokenAddress = new PublicKey(_tokenAddress)
    const walletAddress = new PublicKey(_walletAddress)
    try {
        const tokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            signer,
            tokenAddress,
            walletAddress,
        );
        return tokenAccount
    } catch (error) {
        console.error(error);
        return false
    }
}


export const claimReward = async (stakedToken) => {
    const { mintId, txHash, owner, stakeDuration, rewardAmount } = stakedToken
    const ownerTokenAccountForNFT = await getTokenAccount(mintId, owner)

    // console.log(ownerTokenAccountForNFT);
    let signatures = await connection.getSignaturesForAddress(new PublicKey(ownerTokenAccountForNFT.address), { limit: 1 });

    if (txHash == signatures[0].signature) {
        console.log("signatures matched, valid claim...");
        // const stakeDurationInDays = Math.floor(stakeDuration / 60) //TODO: 86400 secs in 1 day
        // const rewardAmount = stakeDurationInDays * process.env.REWARD_RATE_DAY
        console.log(rewardAmount);

        const hostRewardTokenAccount = new PublicKey(process.env.REWARD_TOKEN_HOST_ACCOUNT)
        const ownerRewardTokenAccount = await getTokenAccount(process.env.REWARD_TOKEN, owner)

        // transfer inititation here
        try {
            const transferSignature = await transfer(
                connection,
                signer,
                hostRewardTokenAccount,
                ownerRewardTokenAccount.address,
                hostAddress,
                rewardAmount * Math.pow(10, process.env.REWARD_TOKEN_DECIMALS)
            );
            console.log(transferSignature)
            return transferSignature
        } catch (error) {
            console.log(error)
            return false
        }
    } else {
        console.log("Signatures not matched")
        console.log("log signature: ",signatures[0].signature);
        console.log("db tx Hash: ", txHash);
    }

}
