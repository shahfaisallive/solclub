import { NextPage } from 'next'
import WalletContextProvider from '../components/WalletContextProvider'
import { Navbar } from '../components/Navbar'
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
        <div>
        </div>
      </WalletContextProvider >
    </div>
  );
}

export default Home;