import React, { FC } from 'react'
import MyTokens from './MyTokens'
import StakedTokens from './StakedTokens'

const StakeScreen: FC = () => {

    return (
        <div className='container'>
            <MyTokens />
            <StakedTokens />
        </div>
    )
}

export default StakeScreen