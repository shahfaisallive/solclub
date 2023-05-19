import TokenModel from "../models/Token.js";
import { PublicKey } from '@solana/web3.js';
import { } from '@solana/spl-token';
import { Metaplex, walletAdapterIdentity } from "@metaplex-foundation/js"
import { connection } from '../middlewares/web3Provider.js';
import { mintList } from '../data/Hashlist.js'

const metaplex = Metaplex.make(connection)

// Get all Tokens in the collection
export const fetchFromSolana = async (req, res) => {
    console.log("fetching all tokens from metaplex...")

    for (let i = 0; i < mintList.length; i++) {
        const tokenInDb = await TokenModel.findOne({ mintId: mintList[i] })
        console.log(tokenInDb);
        if (!tokenInDb) {
            try {
                const mintKey = new PublicKey(mintList[i])
                const nft = await metaplex.nfts().findByMint({ mintAddress: mintKey });
                console.log(i + "fetched metadata for ", nft.mint.address.toString()); //logs

                const token = new TokenModel({
                    mintId: mintList[i],
                    tokenUri: nft.uri,
                    name: nft.json.name,
                    symbol: nft.json.symbol,
                    image: nft.json.image
                })
                await token.save()
            } catch (error) {
                console.log(error);
                const token = new TokenModel({
                    mintId: mintList[i],
                    tokenUri: null,
                    name: null,
                    symbol: null,
                    image: null
                })
                await token.save()
            }
        }
    }
    res.send({
        status: true,
        msg: "Successfully fetched and save all tokens"
    })
}

// Get all Tokens in the collection
export const getAllTokens = async (req, res) => {
    console.log("getting all tokens...")

}