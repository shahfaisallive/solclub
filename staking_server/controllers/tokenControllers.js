import TokenModel from "../models/Token.js";
import StakedToken from "../models/StakedToken.js";
import { PublicKey } from '@solana/web3.js';
import { } from '@solana/spl-token';
import { Metaplex } from "@metaplex-foundation/js"
import { connection } from '../middlewares/web3Provider.js';
import { mintList } from '../data/Hashlist.js'
import axios from "axios";

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

    try {
        const tokens = await TokenModel.find()

        res.send({
            status: true,
            tokens
        })
    } catch (error) {
        console.log(erorr);
        res.send({
            status: false,
            msg: "Failed to fetch tokens"
        })
    }

}

// Get all tokens staked by an address
export const getMyUnstakedTokens = async (req, res) => {
    console.log("getting my unstaked tokens: ", req.params.address);
    const address = req.params.address
    let unstakedTokens
    try {
        unstakedTokens = await (await metaplex.nfts().findAllByOwner({ owner: new PublicKey(address) })).filter(t => t.symbol == 'SOCL')
        for (let i = 0; i < unstakedTokens.length; i++) {
            try {
                const jsonMetadata = await axios.get(unstakedTokens[i].uri)
                unstakedTokens[i].json = jsonMetadata.data
            } catch (error) {
                console.log(error);
            }
        }
        res.send({
            status: true,
            unstakedTokens
        })
    } catch (error) {
        console.log(error);
        res.send({
            status: false,
            msg: "Failed to fetch unstaked tokens"
        })
    }
}

// Get all tokens staked by an address
export const getMyStakedTokens = async (req, res) => {
    // TODO: might be a good idea to fetch token ids from tx logs for host account or just verify from there
    console.log("getting my staked tokens: ", req.params.address);
    const address = req.params.address
    try {
        const stakedTokens = await StakedToken.find({ owner: address })
        console.log(stakedTokens.length);
        res.send({
            status: true,
            stakedTokens
        })
    } catch (error) {
        console.log(error);
        res.send({
            status: false,
            msg: "Failed to fetch staked tokens"
        })
    }
}