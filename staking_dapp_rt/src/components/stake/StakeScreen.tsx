import { AccountLayout, getOrCreateAssociatedTokenAccount, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import React, { FC, useEffect, useState } from 'react'
import MyTokens from './MyTokens'
import StakedTokens from './StakedTokens'
import axiosInstance from '../axios/axiosInstance.js'
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
    const [stakingHostPubKey, setStakingHostPubKey] = useState(null)
    const [walletTokens, setWalletTokens] = useState([])
    const [stakedTokens, setStakedTokens] = useState([])

    // Fetching staked/unstaked token infos on screen render
    const fetchTokensAndAddresses = async () => {
        const hostAddressData = await (await axiosInstance.get(`/staking/hostAddress`)).data
        setStakingHostPubKey(new PublicKey(hostAddressData.hostAddress))

        // Fetching user wallet tokens/unstaked Tokens
        const userWalletResponse = await connection.getTokenAccountsByOwner(
            publicKey,
            {
                programId: TOKEN_PROGRAM_ID
            }
        )
        userWalletResponse.value.forEach(async (e) => {
            const accountInfo = AccountLayout.decode(e.account.data);
            const mintPubkey = new PublicKey(accountInfo.mint)
            if (accountInfo.amount.toString() == "1") {
                let nftMetadata = await metaplex.nfts().findByMint({ mintAddress: mintPubkey })
                console.log(nftMetadata);
                if (nftMetadata.symbol == 'SOCL') {
                    setWalletTokens(tokens => [...tokens, nftMetadata])
                }
            }
        });


        // Fetching user staked Tokens
        const stakedTokensData = await axiosInstance.get(`/token/staked/${publicKey.toString()}`)
        console.log(stakedTokensData.data);
        if (stakedTokensData.data.stakedTokens) {
            stakedTokensData.data.stakedTokens.forEach(async (token) => {
                let mintPubkey = new PublicKey(token.mintId)
                let nftMetadata = await metaplex.nfts().findByMint({ mintAddress: mintPubkey })
                let stakedTokenObj = token
                stakedTokenObj.json = nftMetadata.json
                console.log(stakedTokenObj);
                setStakedTokens(tokens => [...tokens, stakedTokenObj])
            })
        }
        setLoading(false)

    }


    // AUTH IMPLEMENTATION
    const signAuthMessage = async (message: string) => {
        try {
            const messageUint8Array = new TextEncoder().encode(message);
            const signatureBytes = await signMessage(messageUint8Array)
            return signatureBytes
        } catch (error) {
            console.error('Error fetching message:', error);
        }
    };

    // STAKING UNSTAKING FUNCTIONS
    const stakeHandler = async (stakeTokenAddress: PublicKey, stakeDuration: Number) => {
        console.log("stake called...");
        const userWallet = new PublicKey(publicKey)

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
                toOwner: stakingHostPubKey,
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

    const unstakeHandler = async (unstakeTokenAddress: PublicKey) => {
        const authMsgResponse = await axiosInstance.get('/auth/message')
        const authMsg = authMsgResponse.data.message
        console.log("authMsg: ", authMsg);
        const signatureUint8Array = await signAuthMessage(authMsg)
        if (signatureUint8Array) {

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
            fetchTokensAndAddresses()
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