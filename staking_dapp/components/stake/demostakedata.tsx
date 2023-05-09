import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import React, { FC, useEffect, useState } from 'react'
import { createTransferInstruction, getOrCreateAssociatedTokenAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as SplToken from "@solana/spl-token";
import { Keypair, PublicKey, Transaction } from '@solana/web3.js';
import bs58 from "bs58"


const StakeDemo: FC = () => {
    const { publicKey, signTransaction } = useWallet();
    const { connection } = useConnection();

    const [address, setAddress] = useState(null)
    const [walletTokens, setWalletTokens] = useState([])
    const [stakedTokens, setStakedTokens] = useState([])

    const [stakeIndex, setStakeIndex] = useState(null)
    const [unstakeIndex, setUnstakeIndex] = useState(null)

    const stakingWallet = new PublicKey("241AWvZbFCRmmVH3wT4SqdZtC4TVJ7FvCViwxYcUg3JT");
    const signer = Keypair.fromSecretKey(bs58.decode("3kqj5gWhfbcto69KNkKVRZHX9kqFb4r5MW56JwnavGdWPczqLPzpLrU6UKapNYjpBB8D8XM5gvD5JsfvqfsRj6Rq"));
    const stakerSigner = Keypair.fromSecretKey(bs58.decode("3kqj5gWhfbcto69KNkKVRZHX9kqFb4r5MW56JwnavGdWPczqLPzpLrU6UKapNYjpBB8D8XM5gvD5JsfvqfsRj6Rq"));


    // STAKING UNSTAKING FUNCTION
    const stakeHandler = async () => {
        const userWallet = new PublicKey(publicKey)
        const stakeTokenAddress = new PublicKey(walletTokens[stakeIndex])

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

    const unstakeHandler = async () => {
        const userWallet = new PublicKey(publicKey)
        const unstakeTokenAddress = new PublicKey(stakedTokens[unstakeIndex])

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

        const signature = await SplToken.transfer(
            connection,
            stakerSigner,
            fromTokenAccount.address,
            toTokenAccount.address,
            stakingWallet,
            1
        );
        console.log(signature)
    }



    const renderMyTokens = () => {
        return walletTokens.map((token, index) => (
            <div key={index} className="flex row">
                <p className='text-primary mr-3'>{index}</p>
                <p>{token}</p>
            </div>
        ));
    };

    const renderStakedTokens = () => {
        return stakedTokens.map((token, index) => (
            <div key={index} className="flex row">
                <p className='text-primary mr-3'>{index}</p>
                <p>{token}</p>
            </div>
        ));
    };


    useEffect(() => {
        const fetchData = async () => {
            if (publicKey) {
                setAddress(publicKey.toBase58())

                const userWalletResponse = await connection.getTokenAccountsByOwner(
                    publicKey,
                    {
                        programId: TOKEN_PROGRAM_ID
                    }
                )
                userWalletResponse.value.forEach((e) => {
                    const accountInfo = SplToken.AccountLayout.decode(e.account.data);
                    const mint = new PublicKey(accountInfo.mint)
                    if (accountInfo.amount.toString() == "1") {
                        setWalletTokens(mints => [...mints, mint.toBase58()])
                    }
                });
            }
        }
        fetchData()
    }, [publicKey])

    useEffect(() => {
        const fetchData = async () => {
            const stakerWalletResponse = await connection.getTokenAccountsByOwner(
                stakingWallet,
                {
                    programId: TOKEN_PROGRAM_ID
                }
            )
            const newStakedTokens = []
            stakerWalletResponse.value.forEach((e) => {
                const accountInfo = SplToken.AccountLayout.decode(e.account.data);
                const mint = new PublicKey(accountInfo.mint)
                if (accountInfo.amount.toString() == "1" && !stakedTokens.includes(mint.toBase58())) {
                    newStakedTokens.push(mint.toBase58())
                }
            });
            setStakedTokens(newStakedTokens)
        }
        fetchData()
    }, [])

    return (
        <div className='container p-5 text-light'>
            <div className='row'>
                <div className='col-md-7'>
                    <h5>Address</h5>
                    <p>{address}</p>

                    <h5>Tokens in Account</h5>
                    <div>
                        <p>{walletTokens ? walletTokens.length : null} Tokens</p>
                        {renderMyTokens()}
                    </div>

                </div>
                <div className='col-md-5 d-block'>
                    <h4>Stake/Unstake Tokens</h4>
                    <div className='row flex'>
                        <input type="number" className='form-control w-75' placeholder='Enter mint ID to stake' onChange={e => setStakeIndex(e.target.value)} />
                        <button className='btn btn-secondary ml-2' onClick={stakeHandler}>Stake</button>
                    </div>
                    <div className='row flex mt-3'>
                        <input type="number" className='form-control w-75' placeholder='Enter mint ID to unstake' onChange={e => setUnstakeIndex(e.target.value)} />
                        <button className='btn btn-secondary ml-2' onClick={unstakeHandler}>Unstake</button>
                    </div>

                    <div className='mt-5'>
                        <h4>Staked Tokens</h4>
                        <div>
                            <p>{stakedTokens ? stakedTokens.length : null} Tokens</p>
                            {renderStakedTokens()}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}

export default StakeDemo