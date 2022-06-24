import { FC, useContext, useState } from 'react'
import cn from 'classnames'
import Iframe from 'react-iframe-click'

import Window from '../../Window'
import { WindowsContext } from '../../OperatingSystem'

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
  const { focus } = useContext(WindowsContext)

  const [position, setPosition] = useState<{ x: number; y: number }>(
    defaultPosition
  )

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
      <div className="h-full w-full">
        <Iframe
          className="h-full w-full"
          src={url} // FIXME: Resolve type error
          onInferredClick={(e) => {
            onFocus()
          }}
        ></Iframe>
      </div>
    </Window>
  )
}

export default Browser
