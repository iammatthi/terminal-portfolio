import { FC, useContext } from 'react'
import { WindowsContext } from '../../OperatingSystem'
import Window from '../../Window'

interface Props {
  proc: number
  content: string
}

const TextViewer: FC<Props> = ({ proc, content }) => {
  const { closeWindow, getProc } = useContext(WindowsContext)

  const handleClose = () => {
    closeWindow(proc)
  }

  return (
    <Window width="735px" height="480px" draggable onClose={handleClose}>
      <div className="h-full w-full bg-zinc-600">
        <span className="whitespace-pre-wrap">{content}</span>
      </div>
    </Window>
  )
}

export default TextViewer
