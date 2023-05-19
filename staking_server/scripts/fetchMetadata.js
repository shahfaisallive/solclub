import TokenModel from "../models/Token.js";
import { PublicKey } from "@solana/web3.js";
import { mintList } from "../data/Hashlist.js"
import { connection } from "../middlewares/web3Provider.js";
import { Metaplex } from "@metaplex-foundation/js"

const metaplex = Metaplex.make(connection)

const getMetadata = async () => {

    for (let i = 0; i < mintList.length; i++) {
        try {
            const mintKey = new PublicKey(mintList[i])
            const nft = await metaplex.nfts().findByMint({ mintAddress: mintKey });
            console.log(nft.json); //logs
            
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

getMetadata()