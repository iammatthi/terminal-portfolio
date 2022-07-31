import type { NextPage } from 'next'

import { OperatingSystem } from '../components/OperatingSystem'
import GUI from '../components/GUI'

const Home: NextPage = () => {
  return (
    <OperatingSystem>
      <GUI />
    </OperatingSystem>
  )
}

export default Home
