import { WindowsContext } from '@components/OperatingSystem'
import { App } from '@customtypes/apps'
import { FC, useContext, useEffect } from 'react'

export interface Props {}

const GUI: FC<Props> = ({ ...rest }) => {
  const { processes, openWindow } = useContext(WindowsContext)

  useEffect(() => {
    // Add Terminal to processes
    openWindow(App.Terminal, {})
  }, [])

  return (
    <div className="gui relative flex h-full w-full items-center justify-center bg-black text-center">
      {processes.map((process) => (
        <>{process.window}</>
      ))}
    </div>
  )
}

export default GUI
