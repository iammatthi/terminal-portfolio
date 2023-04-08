import type { NextPage } from 'next'

import Footer from '@components/Footer'
import GUI from '@components/GUI'
import { OperatingSystem } from '@components/OperatingSystem'

const Home: NextPage = () => {
  return (
    <>
      <OperatingSystem>
        <GUI />
      </OperatingSystem>
      <Footer />
    </>
  )
}

export default Home
