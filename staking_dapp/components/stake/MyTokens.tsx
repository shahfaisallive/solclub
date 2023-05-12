import React, { FC, useState } from 'react'

interface MyTokensProps {
    walletTokens: string[],
    stakeHandler: (stakeIndex: number) => Promise<void>;}

const MyTokens = ({ walletTokens, stakeHandler }: MyTokensProps) => {
    const [stakeIndex, setStakeIndex] = useState(null)

    const renderTokens = () => {
        return walletTokens.map((token, index) => (
            <div key={index} className="col-md-3">
                <div className="card mb-4">
                    <img className="my-token-img" src={token.image} alt="solkey nft" />
                    <div className="card-body">
                        <h5 className="heading2 text-center text-dark">{token.name}</h5>
                        <button className="btn button1 text-light" onClick={() => stakeHandler(index)}>Stake this Key</button>
                    </div>
                </div>
            </div>
        ));
    };

    return (
        <div className='container'>
            <div className="row justify-content-between">
                <p className="heading1">My Keys</p>
                <p className="text1 mt-2">Total Keys: {walletTokens.length}</p>
            </div>
            <div className="row">
                {renderTokens()}
            </div>
        </div>
    )
}

export default MyTokens