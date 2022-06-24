import { FC, useContext, useEffect, useRef } from 'react'
import Draggable from 'react-draggable'
import { App } from '../../types/apps'
import Terminal from '../apps/Terminal'
import { WindowsContext } from '../OperatingSystem'

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
