import { FC, useContext } from 'react'
import { WindowsContext } from '../../OperatingSystem'
import Window from '../../Window'
import cn from 'classnames'

interface Props {
  process: number
  content: string
  className?: string
  style?: React.CSSProperties
  draggable?: boolean
}

const TextViewer: FC<Props> = ({
  process,
  content,
  className,
  style,
  draggable,
}) => {
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
      <div className="h-full w-full whitespace-pre-wrap bg-zinc-600 p-5 text-left">
        {content}
      </div>
    </Window>
  )
}

export default TextViewer
