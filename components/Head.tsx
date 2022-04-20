import { DefaultSeo } from 'next-seo'
import { FC } from 'react'
import NextHead from 'next/head'
import config from '../config/seo.json'

const Head: FC = () => {
  return (
    <>
      <DefaultSeo {...config} />
      <NextHead>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/site.webmanifest" key="site-manifest" />
        <link rel="icon" href="/favicon.ico" key="favicon" />
      </NextHead>
    </>
  )
}

export default Head
