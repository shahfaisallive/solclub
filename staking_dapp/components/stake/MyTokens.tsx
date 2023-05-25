import React, { FC, useState } from 'react'

interface MyTokensProps {
    walletTokens: string[],
    stakeHandler: (stakeIndex: number, stakeDuration: number) => Promise<void>;
}

const MyTokens: FC<MyTokensProps> = ({ walletTokens, stakeHandler }) => {
    const [stakeIndex, setStakeIndex] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [stakeDuration, setStakeDuration] = useState(0);

    const stakeSelectHandler = (index: number) => {
        setStakeIndex(index);
        setIsModalOpen(true);
    }

    const handleModalConfirm = () => {
        if (stakeIndex !== null && stakeDuration !== 0) {
            const _stakeDuration = stakeDuration * 86400
            stakeHandler(stakeIndex, _stakeDuration)
                .then(() => {
                    setIsModalOpen(false);
                    setStakeIndex(null);
                })
                .catch((error) => {
                    console.log('Stake Error:', error);
                    setIsModalOpen(false);
                    setStakeIndex(null);
                });
        }
    };

    const renderTokens = () => {
        return walletTokens.map((token, index) => (
            <div key={index} className="col-md-3">
                <div className="card mb-4">
                    <img className="my-token-img" src={token.image} alt="solkey nft" />
                    <div className="card-body">
                        <h5 className="heading2 text-center text-dark">{token.name}</h5>
                        <button className="btn button1 text-light" onClick={() => stakeSelectHandler(index)}>Stake this Key</button>
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
            {isModalOpen && (
                <div className="modal" tabIndex={-1} role="dialog" style={{ display: 'block', backgroundColor: '#000000' }}>
                    <div className="modal-dialog" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Confirmation</h5>
                                <button type="button" className="close" onClick={() => setIsModalOpen(false)}>
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div className="modal-body flex">
                                <p>Select the Stake duration</p>
                                <input className="form-check-input" type="radio" name="inlineRadioOptions" id="d_option1" value={7} checked={stakeDuration === 7} onChange={() => setStakeDuration(7)}/>
                                <label className="form-check-label" htmlFor="d_option1">7 Days</label>
                                <input className="form-check-input" type="radio" name="inlineRadioOptions" id="d_option2" value={14} checked={stakeDuration === 14} onChange={() => setStakeDuration(14)}/>
                                <label className="form-check-label" htmlFor="d_option2">14 Days</label>
                                <input className="form-check-input" type="radio" name="inlineRadioOptions" id="d_option3" value={28} checked={stakeDuration === 28} onChange={() => setStakeDuration(28)}/>
                                <label className="form-check-label" htmlFor="d_option3">28 Days</label>

                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="button" className="btn btn-primary" onClick={handleModalConfirm} disabled={!stakeDuration ? true : false}>Stake</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MyTokens;
