import { FC, useState } from 'react'
import Window from '../../Window'
import cn from 'classnames'

interface Props {
  processId: number
  className?: string
  style?: React.CSSProperties
  draggable?: boolean
  data: {
    content: string
  }
  defaultPosition: {
    x: number
    y: number
  }
}

const TextViewer: FC<Props> = ({
  processId,
  className,
  style,
  draggable,
  data: { content },
  defaultPosition,
}) => {
  const [position, setPosition] = useState<{ x: number; y: number }>(
    defaultPosition
  )

  const handlePositionChange = (position: { x: number; y: number }) => {
    setPosition(position)
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
      <div className="h-full w-full whitespace-pre-wrap bg-zinc-600 p-5 text-left">
        {content}
      </div>
    </Window>
  )
}

export default TextViewer
