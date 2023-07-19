// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React from 'react';
import { FC, ReactNode } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import * as web3 from '@solana/web3.js'
import * as walletAdapterWallets from '@solana/wallet-adapter-wallets';
require('@solana/wallet-adapter-react-ui/styles.css');

const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
	const endpoint = web3.clusterApiUrl('devnet')
	const wallets = [new walletAdapterWallets.PhantomWalletAdapter()]

	return (
		<ConnectionProvider endpoint={endpoint}>
			<WalletProvider wallets={wallets} autoConnect={true}>
				<WalletModalProvider>
					{children}
				</WalletModalProvider>
			</WalletProvider>
		</ConnectionProvider>
	)
}

export default WalletContextProvider



// import { FC, ReactNode } from 'react';
// import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
// import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
// import { Adapter } from '@solana/wallet-adapter-base';
// import * as web3 from '@solana/web3.js';
// import * as walletAdapterWallets from '@solana/wallet-adapter-wallets';
// require('@solana/wallet-adapter-react-ui/styles.css');

// const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
//   const endpoint = web3.clusterApiUrl('devnet');
//   const wallets: Adapter[] = [new walletAdapterWallets.PhantomWalletAdapter()];

//   return (
//     <ConnectionProvider endpoint={endpoint}>
//       <WalletProvider wallets={wallets} autoConnect={true}>
//         <WalletModalProvider>{children}</WalletModalProvider>
//       </WalletProvider>
//     </ConnectionProvider>
//   );
// };

// export default WalletContextProvider;
