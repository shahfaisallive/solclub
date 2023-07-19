import React from 'react';
import { FC } from 'react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

export const Navbar: FC = () => {
    return (
        <nav className="navbar justify-content-between">
            <a href="solclub.io" className="navbar-brand">
                <img src="/solclubLogo.png" alt="logo" className="navlogo"/>
            </a>
            <div>
                <WalletMultiButton />
            </div>
        </nav>

    )
}