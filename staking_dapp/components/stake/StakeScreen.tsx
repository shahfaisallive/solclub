import { AccountLayout, getOrCreateAssociatedTokenAccount, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
// import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import React, { FC, useEffect, useState } from 'react'
import MyTokens from './MyTokens'
import StakedTokens from './StakedTokens'
import axiosInstance from '../axios/axiosInstance.js'
import axios from 'axios'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Metaplex, Signer, walletAdapterIdentity } from '@metaplex-foundation/js';

const StakeScreen: FC = () => {
    const { publicKey, signTransaction, signMessage } = useWallet();
    const wallet = useWallet()
    const connection = new Connection(
        "https://solana-mainnet.g.alchemy.com/v2/Dsu3oYYI0gI4R4D9LCNPQimGXXOmb6k5"
        // "https://solana-devnet.g.alchemy.com/v2/QWm3ITJ7nSGPWrevn6EPYn4KE9I631G7"
    )
    const metaplex = Metaplex.make(connection)

    const [loading, setLoading] = useState(false)
    const [address, setAddress] = useState(null)
    const [walletTokensIDs, setWalletTokensIDs] = useState([])
    const [stakedTokensIDs, setStakedTokensIDs] = useState([])
    const [walletTokens, setWalletTokens] = useState([])
    const [stakedTokens, setStakedTokens] = useState([])


    // Staking Wallets and signers
    // const stakingHost = "241AWvZbFCRmmVH3wT4SqdZtC4TVJ7FvCViwxYcUg3JT" //TODO: secure it
    const stakingHost = "XNtcFVQtdPQgCZH4EKK93G9mwhdk9rgnvgWoqhuc9Gw" //TODO: secure it main

    const stakingWallet = new PublicKey(stakingHost);

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
            // console.log(mint.toBase58());
            if (accountInfo.amount.toString() == "1") {
                walletTokens.push(mint.toBase58())
                setWalletTokensIDs(mints => [...mints, mint.toBase58()])
            }
        });


        // Staker wallet Tokens are fetched here
        const stakedTokensData = await axiosInstance.get(`/token/staked/${publicKey.toString()}`)
        console.log(stakedTokensData.data);
        if (stakedTokensData.data.stakedTokens) {
            stakedTokensData.data.stakedTokens.forEach(t => {
                console.log(t.mintId);
                stakedTokens.push(t.mintId)
                setStakedTokens(tokens => [...tokens, t])
                setStakedTokensIDs(mints => [...mints, t.mintId])
            })
        }

        return {
            walletTokens,
            stakedTokens
        }

    }

    // Get tokens metadata 
    const getTokensMetadata = async (tokens, walletAddress) => {
        const { walletTokens, stakedTokens } = tokens

        let walletTokensMetadata = []
        let stakedTokensMetadata = []

        // Get wallet tokens metadata
        for (let i = 0; i < walletTokens.length; i++) {
            try {
                let mintPubkey = new PublicKey(walletTokens[i])
                let tokenMeta = await metaplex.nfts().findByMint({ mintAddress: mintPubkey })
                console.log(tokenMeta);
                if (tokenMeta.symbol == 'SOCL') {
                    walletTokensMetadata.push(tokenMeta.json)
                }
            } catch (error) {
                console.log(error);
                console.error(`FAILED!!! Couldn't fetch token metadata for ${walletTokens[i]}`)
            }
        }
        setWalletTokens(walletTokensMetadata)

        // Get staked tokens metadata
        for (let i = 0; i < stakedTokens.length; i++) {
            try {
                console.log("stake token address: ", stakedTokens[i]);
                let mintPubkey = new PublicKey(stakedTokens[i])
                let tokenMeta = await metaplex.nfts().findByMint({ mintAddress: mintPubkey })
                console.log(tokenMeta);
                let stakedTokenObj = stakedTokens[i]
                stakedTokenObj.json = tokenMeta.json
                stakedTokensMetadata.push(stakedTokenObj)
            } catch (error) {
                console.log(error);
                console.error(`FAILED!!! Couldn't fetch token metadata for ${stakedTokens[i]}`)
            }
        }
        setStakedTokens(stakedTokensMetadata)
        setLoading(false)

    }

    // AUTH IMPLEMENTATION
    const signAuthMessage = async (message) => {
        try {
            const messageUint8Array = new TextEncoder().encode(message);
            const signatureBytes = await signMessage(messageUint8Array)
            return signatureBytes
        } catch (error) {
            console.error('Error fetching message:', error);
        }
    };

    // STAKING UNSTAKING FUNCTIONS
    const stakeHandler = async (stakeIndex, stakeDuration) => {
        console.log("stake called...");
        const userWallet = new PublicKey(publicKey)
        const stakeTokenAddress = new PublicKey(walletTokensIDs[stakeIndex])

        const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            address,
            stakeTokenAddress,
            userWallet,
        );
        console.log(fromTokenAccount.address.toBase58());

        const toTokenAccount = await axiosInstance.get(`/staking/token-account/${stakeTokenAddress.toBase58()}`)
        console.log("hostTokenAccount: ", toTokenAccount.data.tokenAccount);

        let txHash

        try {
            const feePayer: Signer = {
                publicKey: userWallet,
                signTransaction: async (tx) => tx,
                signMessage: async (msg) => msg,
                signAllTransactions: async (txs) => txs,
            };

            metaplex.use(walletAdapterIdentity({
                publicKey: userWallet,
                signTransaction: async (tx) => tx,
            }))

            const nftToStake = await metaplex.nfts().findByMint({ mintAddress: stakeTokenAddress });
            console.log(nftToStake);
            const stakeTxObj = metaplex.nfts().builders().transfer({
                nftOrSft: nftToStake,
                fromOwner: userWallet,
                toOwner: stakingWallet,
                authority: feePayer,
            });
            const blockhash = await connection.getLatestBlockhash();

            const stakeTx = await signTransaction(stakeTxObj.toTransaction(blockhash))
            txHash = await connection.sendRawTransaction(stakeTx.serialize())
            console.log("stakeHash: ", txHash)

        } catch (error) {
            console.log(error);
        }
        if (txHash) {
            console.log("stake tx Completed");
            const stakeObj = {
                mintId: stakeTokenAddress,
                txHash,
                stakeDuration,
                ownerAddress: address,
                ownerTokenAccount: fromTokenAccount.address.toString(),
                hostTokenAccount: toTokenAccount.data.tokenAccount
            }
            const stakeRequest = await axiosInstance.post('/staking/stake', stakeObj, {
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            console.log(stakeRequest);
        } else {
            console.log("transaction failed");
        }

    }

    const unstakeHandler = async (unstakeIndex) => {
        const authMsgResponse = await axiosInstance.get('/auth/message')
        const authMsg = authMsgResponse.data.message
        console.log("authMsg: ", authMsg);
        const signatureUint8Array = await signAuthMessage(authMsg)
        console.log("unstake id: ", stakedTokensIDs[unstakeIndex]);
        if (signatureUint8Array) {
            const unstakeTokenAddress = new PublicKey(stakedTokensIDs[unstakeIndex])

            const unstakeObj = {
                mintId: unstakeTokenAddress,
                authMsg,
                signatureUint8Array,
                walletAddress: address
            }
            const unstakeRequest = await axiosInstance.post('/staking/unstake', unstakeObj, {
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            console.log(unstakeRequest);
        } else {
            console.log("Unable to sign the message");
        }
    }


    useEffect(() => {
        setLoading(true)
        if (publicKey) {
            setAddress(publicKey.toBase58())
            fetchTokens().then(tokens => {
                getTokensMetadata(tokens, publicKey.toBase58())
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