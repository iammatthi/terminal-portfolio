import Head from '@components/Head'
import Layout from '@components/Layout'
import '@styles/globals.css'
import type { AppProps } from 'next/app'
import Layout from '../components/Layout'
import Head from '../components/Head'
import { OperatingSystem } from '../components/OperatingSystem'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head />
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  )
}

export default MyApp
