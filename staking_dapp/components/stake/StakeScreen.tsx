import { AccountLayout, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Keypair, PublicKey } from '@solana/web3.js';
import bs58 from "bs58"
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import React, { FC, useEffect, useState } from 'react'
import MyTokens from './MyTokens'
import StakedTokens from './StakedTokens'
import axios from 'axios';

const StakeScreen: FC = () => {
    const { publicKey, signTransaction } = useWallet();
    const { connection } = useConnection();

    const [loading, setLoading] = useState(false)
    const [address, setAddress] = useState(null)
    const [walletTokens, setWalletTokens] = useState([])
    const [stakedTokens, setStakedTokens] = useState([])


    // Staking Wallets and signers
    const stakingHost = "241AWvZbFCRmmVH3wT4SqdZtC4TVJ7FvCViwxYcUg3JT" //TODO: secure it
    const signerKey = "3kqj5gWhfbcto69KNkKVRZHX9kqFb4r5MW56JwnavGdWPczqLPzpLrU6UKapNYjpBB8D8XM5gvD5JsfvqfsRj6Rq" //TODO: secure it

    const stakingWallet = new PublicKey(stakingHost);
    const signer = Keypair.fromSecretKey(bs58.decode(signerKey));
    const stakerSigner = Keypair.fromSecretKey(bs58.decode(signerKey));

    // Fetching staked/unstaked token infos on screen render
    const fetchTokens = async () => {
        let walletTokens = []
        let stakedTokens = []

        const userWalletResponse = await connection.getTokenAccountsByOwner(
            publicKey,
            {
                programId: TOKEN_PROGRAM_ID
            }
        )
        userWalletResponse.value.forEach((e) => {
            const accountInfo = AccountLayout.decode(e.account.data);
            const mint = new PublicKey(accountInfo.mint)
            if (accountInfo.amount.toString() == "1") {
                walletTokens.push(mint.toBase58())
            }
        });

        const stakerWalletResponse = await connection.getTokenAccountsByOwner(
            stakingWallet,
            {
                programId: TOKEN_PROGRAM_ID
            }
        )
        // const newStakedTokens = []
        stakerWalletResponse.value.forEach((e) => {
            const accountInfo = AccountLayout.decode(e.account.data);
            const mint = new PublicKey(accountInfo.mint)
            if (accountInfo.amount.toString() == "1") {
                stakedTokens.push(mint.toBase58())
            }
        });

        return {
            walletTokens,
            stakedTokens
        }

    }

    // Get tokens metadata 
    const getTokensMetadata = async (tokens) => {
        const { walletTokens, stakedTokens } = tokens

        let walletTokensMetadata = []
        let stakedTokensMetadata = []

        // Get wallet tokens metadata
        for (let i = 0; i < walletTokens.length; i++) {
            try {
                let mintPubkey = new PublicKey(walletTokens[i])
                let tokenMetaPubkey = await Metadata.getPDA(mintPubkey)
                const tokenmeta = await Metadata.load(connection, tokenMetaPubkey);
                const jsonMetadata = await axios.get(tokenmeta.data.data.uri)
                console.log(jsonMetadata.data);
                walletTokensMetadata.push(jsonMetadata.data)
            } catch (error) {
                console.error(`FAILED!!! Couldn't fetch token metadata for ${walletTokens[i]}`)
            }
        }
        setWalletTokens(walletTokensMetadata)

        // Get staked tokens metadata
        for (let i = 0; i < stakedTokens.length; i++) {
            try {
                let mintPubkey = new PublicKey(stakedTokens[i])
                let tokenMetaPubkey = await Metadata.getPDA(mintPubkey)
                const tokenmeta = await Metadata.load(connection, tokenMetaPubkey);
                const jsonMetadata = await axios.get(tokenmeta.data.data.uri)
                console.log(jsonMetadata.data);
                stakedTokensMetadata.push(jsonMetadata.data)
            } catch (error) {
                console.error(`FAILED!!! Couldn't fetch token metadata for ${stakedTokens[i]}`)
            }
        }
        setStakedTokens(stakedTokensMetadata)
    }

    useEffect(() => {
        if (publicKey) {
            setAddress(publicKey.toBase58())
            fetchTokens().then(tokens => {
                getTokensMetadata(tokens)
            })
        } else {

        }
    }, [publicKey])

    return (
        <div className='container'>
            <MyTokens walletTokens={walletTokens} />
            <StakedTokens stakedTokens={stakedTokens} />
        </div>
    )
}

export default StakeScreen