import React, { FC, useState } from 'react'

interface StakedTokensProps {
    stakedTokens: string[]
}

const StakedTokens= ({stakedTokens}: StakedTokensProps) => {
    const [unstakeIndex, setUnstakeIndex] = useState(null)

    const renderTokens = () => {
        return stakedTokens.map((token, index) => (
            <div key={index} className="col-md-3">
                <div className="card mb-4">
                    <img className="my-token-img" src="./solkey.png" alt="solkey nft" />
                    <div className="card-body">
                        <h5 className="heading2 text-center text-dark">Key#2103</h5>
                        <p className="text1 text-center text-dark">24 days left</p>
                        <button className="btn button1 text-light">Unstake this Key</button>
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