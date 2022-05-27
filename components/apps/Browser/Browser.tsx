import { FC, useContext } from 'react'
import { WindowsContext } from '../../OperatingSystem'
import Window from '../../Window'
import cn from 'classnames'

interface Props {
  process: number
  url: string
  className?: string
  style?: React.CSSProperties
  draggable?: boolean
}

const Browser: FC<Props> = ({ process, url, className, style, draggable }) => {
  const { closeWindow, getProcess } = useContext(WindowsContext)

  const handleClose = () => {
    closeWindow(process)
  }

  return (
    <Window
      draggable={draggable}
      onClose={handleClose}
      style={{ ...style }}
      className={cn(className)}
    >
      <div className="h-full w-full">
        <iframe className="h-full w-full" src={url}></iframe>
      </div>
    </Window>
  )
}

export default Browser
