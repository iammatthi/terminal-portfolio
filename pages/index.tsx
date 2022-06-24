import { FC, useContext, useState } from 'react'
import type { NextPage } from 'next'

import Terminal from '../components/apps/Terminal'
import { OperatingSystem, WindowsContext } from '../components/OperatingSystem'
import GUI from '../components/GUI'

const Home: NextPage = () => {
  return (
    <OperatingSystem>
      <GUI />
    </OperatingSystem>
  )
}

export default Home
