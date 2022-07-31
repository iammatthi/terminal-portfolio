import cn from 'classnames'
import { FC, useContext, useState } from 'react'
import Iframe from 'react-iframe-click'
import { WindowsContext } from '../../OperatingSystem'
import Window from '../../Window'

interface Props {
  processId: number
  className?: string
  style?: React.CSSProperties
  draggable?: boolean
  data: {
    url: string
  }
  defaultPosition: {
    x: number
    y: number
  }
}

const Browser: FC<Props> = ({
  processId,
  className,
  style,
  draggable,
  data: { url },
  defaultPosition,
}) => {
  const [loaded, setLoaded] = useState<boolean>(false)
  const [position, setPosition] = useState<{ x: number; y: number }>(
    defaultPosition
  )

  const { focus } = useContext(WindowsContext)

  const handlePositionChange = (position: { x: number; y: number }) => {
    setPosition(position)
  }

  const onFocus = () => {
    focus(processId) // FIXME: How to do it better
  }

  return (
    <Window
      draggable={draggable}
      style={{ ...style }}
      className={cn(className)}
      processId={processId}
      onPositionChange={handlePositionChange}
      position={position}
      defaultPosition={defaultPosition}
    >
      <div className="relative h-full w-full">
        <div
          className={cn(
            { hidden: loaded },
            'absolute h-full w-full bg-white text-left text-black'
          )}
        ></div>
        <Iframe
          className="h-full w-full"
          // @ts-ignore
          src={url} // FIXME: Resolve type error
          onInferredClick={(e) => {
            onFocus()
          }}
          onLoad={(e) => setLoaded(true)}
        ></Iframe>
      </div>
    </Window>
  )
}

export default Browser
