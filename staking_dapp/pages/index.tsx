import { NextPage } from 'next'
import WalletContextProvider from '../components/wallet_context/WalletContextProvider'
import { Navbar } from '../components/navbar/Navbar'
import StakingScreen from '../components/stake/StakeScreen'
import Head from 'next/head'

const Home: NextPage = () => {

  return (
    <div>
      <Head>
        <title>Solclub Staking</title>
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" />

      </Head>
      <WalletContextProvider>
        <Navbar />
        <div className="pt-5">
          <StakingScreen />
        </div>
      </WalletContextProvider >
    </div>
  );
}

export default Home;