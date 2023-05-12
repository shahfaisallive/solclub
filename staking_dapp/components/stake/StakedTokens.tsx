import React, { FC, useState } from 'react'

interface StakedTokensProps {
    stakedTokens: string[],
    unstakeHandler: (unstakeIndex: number) => Promise<void>;}

const StakedTokens = ({ stakedTokens, unstakeHandler }: StakedTokensProps) => {
    const [unstakeIndex, setUnstakeIndex] = useState(null)

    const renderTokens = () => {
        return stakedTokens.map((token, index) => (
            <div key={index} className="col-md-3">
                <div className="card mb-4">
                    <img className="my-token-img" src={token.image} alt="solkey nft" />
                    <div className="card-body">
                        <h5 className="heading2 text-center text-dark">{token.name}</h5>
                        <p className="text1 text-center text-dark">24 days left</p>
                        <button className="btn button1 text-light" onClick={() => unstakeHandler(index)}>Unstake this Key</button>
                    </div>
                </div>
            </div>
        ));
    };

    return (
        <div className='container mt-5'>
            <div className="row justify-content-between">
                <p className="heading1">Staked Keys</p>
                <p className="text1 mt-2">Total Staked: {stakedTokens.length}</p>
            </div>
            <div className="row">
                {renderTokens()}
            </div>
        </div>
    )
}

export default StakedTokens