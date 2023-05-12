import { AccountLayout, createTransferInstruction, getOrCreateAssociatedTokenAccount, TOKEN_PROGRAM_ID, transfer } from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Keypair, PublicKey, Transaction } from '@solana/web3.js';
import bs58 from "bs58"
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import React, { FC, useEffect, useState } from 'react'
import MyTokens from './MyTokens'
import StakedTokens from './StakedTokens'
import axios from 'axios';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const StakeScreen: FC = () => {
    const { publicKey, signTransaction } = useWallet();
    const { connection } = useConnection();

    const [loading, setLoading] = useState(false)
    const [address, setAddress] = useState(null)
    const [walletTokensIDs, setWalletTokensIDs] = useState([])
    const [stakedTokensIDs, setStakedTokensIDs] = useState([])
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
                setWalletTokensIDs(mints => [...mints, mint.toBase58()])
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
                setStakedTokensIDs(mints => [...mints, mint.toBase58()])
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
                console.log(jsonMetadata);
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

    // STAKING UNSTAKING FUNCTIONS
    const stakeHandler = async (stakeIndex) => {
        const userWallet = new PublicKey(publicKey)
        const stakeTokenAddress = new PublicKey(walletTokensIDs[stakeIndex])

        const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            address,
            stakeTokenAddress,
            userWallet,
        );
        const toTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            signer,
            stakeTokenAddress,
            stakingWallet,
        );

        const transaction = new Transaction().add(
            createTransferInstruction(
                fromTokenAccount.address,
                toTokenAccount.address,
                userWallet,
                1,
                [],
                TOKEN_PROGRAM_ID
            )
        )

        const latestBlockHash = await connection.getLatestBlockhash();
        transaction.recentBlockhash = latestBlockHash.blockhash;
        transaction.feePayer = userWallet;
        const signed = await signTransaction(transaction);
        const _signature = await connection.sendRawTransaction(signed.serialize());
        console.log("signature: ", _signature);
    }

    const unstakeHandler = async (unstakeIndex) => {
        const userWallet = new PublicKey(publicKey)
        const unstakeTokenAddress = new PublicKey(stakedTokensIDs[unstakeIndex])

        const toTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            address,
            unstakeTokenAddress,
            userWallet,
        );
        const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            address,
            unstakeTokenAddress,
            stakingWallet,
        );

        const signature = await transfer(
            connection,
            stakerSigner,
            fromTokenAccount.address,
            toTokenAccount.address,
            stakingWallet,
            1
        );
        console.log(signature)
    }


    useEffect(() => {
        setLoading(true)
        if (publicKey) {
            setAddress(publicKey.toBase58())
            fetchTokens().then(tokens => {
                getTokensMetadata(tokens)
                setLoading(false)
            })
        } else {
            setLoading(false)
        }
    }, [publicKey])

    return (
        <div className='container'>
            {!address ? <div>
                <p className='heading1 text-center'>Please Connect your Phantom wallet</p>
                <div className='d-flex justify-content-center'>
                    <WalletMultiButton />
                </div>
            </div> : loading && address ? <div className='d-flex justify-content-center'>
                <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">Loading...</span>
                </div>
            </div>
                : <>
                    <MyTokens walletTokens={walletTokens} stakeHandler={stakeHandler} />
                    <StakedTokens stakedTokens={stakedTokens} unstakeHandler={unstakeHandler} />
                </>}
        </div>
    )
}

export default StakeScreen