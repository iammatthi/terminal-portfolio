import { FC, useContext } from 'react'
import { WindowsContext } from '../../OperatingSystem'
import Window from '../../Window'

interface Props {
  proc: number
  url: string
}

const Browser: FC<Props> = ({ proc, url }) => {
  const { closeWindow, getProc } = useContext(WindowsContext)

  const handleClose = () => {
    closeWindow(proc)
  }

  return (
    <Window width="735px" height="480px" draggable onClose={handleClose}>
      <div className="h-full w-full">
        <iframe className="h-full w-full" src={url}></iframe>
      </div>
    </Window>
  )
}

export default Browser
