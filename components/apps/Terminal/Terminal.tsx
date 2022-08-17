import { WindowsContext } from '@components/OperatingSystem'
import Window from '@components/Window'
import { App } from '@customtypes/apps'
import cn from 'classnames'
import dynamic from 'next/dynamic'
import { FC, useContext, useState } from 'react'
import { TerminalEngineProps } from './TerminalEngine'
const TerminalEngine = dynamic<TerminalEngineProps>(
  () => import('./TerminalEngine').then(({ TerminalEngine }) => TerminalEngine),
  { ssr: false }
)

interface Props {
  processId: number
  className?: string
  style?: React.CSSProperties
  draggable?: boolean
  defaultPosition: {
    x: number
    y: number
  }
}

const Terminal: FC<Props> = ({
  processId,
  className,
  style,
  draggable,
  defaultPosition,
}) => {
  const { openWindow } = useContext(WindowsContext)
  const [path, setPath] = useState<string[]>([])

  const [position, setPosition] = useState<{ x: number; y: number }>(
    defaultPosition
  )

  const handlePositionChange = (position: { x: number; y: number }) => {
    setPosition(position)
  }

  return (
    <Window
      title={`${process.env.NEXT_PUBLIC_AUTHOR_USERNAME}@portfolio:~${
        path.length > 0 ? '/' + path.join('/') : ''
      }`}
      draggable={draggable}
      style={{ fontFamily: 'Ubuntu Mono', ...style }}
      className={cn(className)}
      processId={processId}
      onPositionChange={handlePositionChange}
      position={position}
      defaultPosition={defaultPosition}
    >
      <TerminalEngine
        openWindow={(app: App, data: any) => openWindow(app, data, position)}
        onPathChange={(path: string[]) => setPath(path)}
      />
    </Window>
  )
}

export default Terminal
