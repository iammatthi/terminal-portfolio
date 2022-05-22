import { FC, useContext, useState } from 'react'
import type { NextPage } from 'next'

import Terminal from '../components/apps/Terminal'
import { WindowsContext } from '../components/OperatingSystem'

const Home: NextPage = () => {
  const { windows } = useContext(WindowsContext)

  return (
    <div className="flex h-full w-full items-center justify-center bg-black text-center">
      <Terminal />
      {windows.map((window) => (
        <>{window}</>
      ))}
    </div>
  )
}

export default Home
