import { WindowsContext } from '@components/OperatingSystem'
import cn from 'classnames'
import { FC, MouseEvent, useContext, useRef } from 'react'
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable'
import {
  VscChromeClose,
  VscChromeMaximize,
  VscChromeMinimize
} from 'react-icons/vsc'
import s from './Window.module.css'

export interface Props {
  title?: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  draggable?: boolean
  processId: number
  position?: {
    x: number
    y: number
  }
  defaultPosition?: {
    x: number
    y: number
  }
  onPositionChange?: (position: { x: number; y: number }) => void
  onClose?: () => void
  onMaximize?: () => void
  onMinimize?: () => void
}

const Window: FC<Props> = ({
  title,
  children,
  className,
  draggable,
  processId,
  position,
  defaultPosition,
  onPositionChange,
  onClose,
  onMaximize,
  onMinimize,
  style,
  ...rest
}) => {
  const { getOrder, closeWindow, focusWindow } = useContext(WindowsContext)

  const handleStop = (e: DraggableEvent, data: DraggableData) => {
    if (onPositionChange) onPositionChange({ x: data.x, y: data.y })
  }

  const handleClose = (event: MouseEvent<HTMLButtonElement>) => {
    closeWindow(processId)
    if (onClose) onClose()
  }

  const handleMaximize = (event: MouseEvent<HTMLButtonElement>) => {
    if (onMaximize) onMaximize()
  }

  const handleMinimize = (event: MouseEvent<HTMLButtonElement>) => {
    if (onMinimize) onMinimize()
  }

  const handleMouseDown = (event: globalThis.MouseEvent) => {
    focusWindow(processId)
  }

  const nodeRef = useRef(null)

  return (
    <Draggable
      nodeRef={nodeRef}
      disabled={!draggable}
      bounds=".gui"
      handle=".drag"
      cancel=".not-drag"
      onMouseDown={handleMouseDown}
      onStop={handleStop}
      position={position}
      defaultPosition={defaultPosition}
    >
      <div
        className={cn(s.root, className)}
        style={{ zIndex: getOrder(processId) + 10, ...style }}
        ref={nodeRef}
      >
        <div className={cn(s.header, 'drag')} style={{ height: '50px' }}>
          <div className={cn(s.headerTitle)}>
            <span className={cn(s.headerTitleText)}>{title}</span>
          </div>
          <div className={cn(s.headerButtonsContainer)}>
            <div className={cn(s.headerButtons, 'not-drag')}>
              <button className={cn(s.headerButton)} onClick={handleMinimize}>
                <VscChromeMinimize size={14} className="translate-y-1/4" />
              </button>
              <button className={cn(s.headerButton)} onClick={handleMaximize}>
                <VscChromeMaximize size={14} />
              </button>
              <button className={cn(s.headerButton)} onClick={handleClose}>
                <VscChromeClose size={14} />
              </button>
            </div>
          </div>
        </div>
        <div className="w-full grow overflow-auto">{children}</div>
      </div>
    </Draggable>
  )
}

export default Window
