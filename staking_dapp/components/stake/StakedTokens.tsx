import React, { FC, useState } from 'react'

interface StakedTokensProps {
    stakedTokens: string[],
    unstakeHandler: (unstakeIndex: number) => Promise<void>;
}

const StakedTokens = ({ stakedTokens, unstakeHandler }: StakedTokensProps) => {
    const [unstakeIndex, setUnstakeIndex] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const unstakeSelectHandler = (index: number) => {
        setUnstakeIndex(index);
        setIsModalOpen(true);
    }

    const handleModalConfirm = () => {
        if (unstakeIndex !== null) {
            unstakeHandler(unstakeIndex)
                .then(() => {
                    setIsModalOpen(false);
                    setUnstakeIndex(null);
                })
                .catch((error) => {
                    console.log('Stake Error:', error);
                    setIsModalOpen(false);
                    setUnstakeIndex(null);
                });
        }
    };

    const timeRemaining = (stakedAt, duration) => {
        const timeRemaining = (stakedAt + duration) - Math.floor((new Date().getTime()) / 1000)
        const secondsInMinute = 60;
        const secondsInHour = 60 * secondsInMinute;
        const secondsInDay = 24 * secondsInHour;
      
        const days = Math.floor(timeRemaining / secondsInDay);
        const hours = Math.floor((timeRemaining % secondsInDay) / secondsInHour);
        const minutes = Math.floor((timeRemaining % secondsInHour) / secondsInMinute);

        let timeString = '';

        if (timeRemaining > 0) {
            if (days > 0) {
                timeString += days + (days === 1 ? ' day ' : ' days ');
            }

            if (hours > 0) {
                timeString += hours + (hours === 1 ? ' hour ' : ' hours ');
            }

            if (minutes > 0) {
                timeString += minutes + (minutes === 1 ? ' min ' : ' mins ');
            }
        } else {
            timeString = "Lock Duration Ended"
        }

        return timeString.trim();
    }

    const getUnstakeDisabled = (stakedAt, duration) => {
        const timeRemaining = (stakedAt + duration) - Math.floor((new Date().getTime()) / 1000)
        if (timeRemaining > 0) {
            return true
        } else {
            return false
        }
    }

    const renderTokens = () => {
        return stakedTokens.map((token, index) => (
            <div key={index} className="col-md-3">
                <div className="card mb-4">
                    <img className="my-token-img" src={token.tokenData.image} alt="solkey nft" />
                    <div className="card-body">
                        <h5 className="heading2 text-center text-dark">{token.tokenData.name}</h5>
                        <p className="text1 text-center text-dark">{timeRemaining(token.stakedAt, token.stakeDuration)}</p>
                        <p className="text1 text-center text-dark">Reward: {token.rewardAmount}</p>
                        <button className="btn button1 text-light" disabled={getUnstakeDisabled(token.stakedAt, token.stakeDuration)} onClick={() => unstakeSelectHandler(index)}>Unstake this Key</button>
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
                                <p className='text-dark'>Are you sure, you want to unstake this token?</p>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="button" className="btn btn-primary" onClick={handleModalConfirm}>Yes! Unstake Now</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default StakedTokens