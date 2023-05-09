import React, { FC, useState } from 'react'

const MyTokens: FC = () => {
    const [walletTokens, setWalletTokens] = useState([1, 2, 3, 4, 5, 6, 7, 8])


    const renderTokens = () => {
        return walletTokens.map((token, index) => (
            <div key={index} className="col-md-3">
                <div className="card mb-4">
                    <img className="my-token-img" src="./solkey.png" alt="solkey nft" />
                    <div className="card-body">
                        <h5 className="heading2 text-center text-dark">Key#2103</h5>
                        <button className="btn button1 text-light">Stake this Key</button>
                    </div>
                </div>
            </div>
        ));
    };

    return (
        <div className='container'>
            <div className="row justify-content-between">
                <p className="heading1">My Keys</p>
                <p className="text1 mt-2">Total Keys: 8</p>
            </div>
            <div className="row">
                {renderTokens()}
            </div>
        </div>
    )
}

export default MyTokens