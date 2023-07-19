import React from 'react';
import WalletContextProvider from './components/wallet_context/WalletContextProvider';
import { Navbar } from './components/navbar/Navbar';
import StakingScreen from './components/stake/StakeScreen'

function App() {
  return (
    <div className="App">
      <WalletContextProvider>
        <Navbar />
        <div className="pt-5">
          <StakingScreen />
        </div>
      </WalletContextProvider >
    </div>
  );
}

export default App;
