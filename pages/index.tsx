import type { NextPage } from 'next'

import GUI from '@components/GUI'
import { OperatingSystem } from '@components/OperatingSystem'

const Home: NextPage = () => {
  return (
    <OperatingSystem>
      <GUI />
    </OperatingSystem>
  )
}

export default Home
