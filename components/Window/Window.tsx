import cn from 'classnames'
import { FC, useRef } from 'react'
import Draggable from 'react-draggable'
import {
  VscChromeClose,
  VscChromeMaximize,
  VscChromeMinimize,
} from 'react-icons/vsc'
import s from './Window.module.css'

interface Props {
  title: string
  children: React.ReactNode
  className?: string
  width?: string
  height?: string
  draggable?: boolean
  onClose?: () => void
  onMaximize?: () => void
  onMinimize?: () => void
}

const Window: FC<Props> = ({
  title,
  children,
  className,
  width,
  height,
  draggable,
  onClose,
  onMaximize,
  onMinimize,
  ...rest
}) => {
  const handleClose = () => {
    if (onClose) {
      onClose()
    }
  }

  const handleMaximize = () => {
    if (onMaximize) {
      onMaximize()
    }
  }

  const handleMinimize = () => {
    if (onMinimize) {
      onMinimize()
    }
  }

  const nodeRef = useRef(null)

  return (
    <Draggable
      nodeRef={nodeRef}
      disabled={!draggable}
      bounds="parent"
      handle=".header"
    >
      <div
        className={cn(s.root, className)}
        style={{ width: width, height: height }}
        ref={nodeRef}
      >
        <div
          className="header relative flex w-full cursor-default items-center justify-center rounded-t-lg bg-zinc-800 p-5"
          style={{ height: '50px' }}
        >
          <span>{title}</span>
          <div className="absolute right-0 flex flex-row gap-2 p-3">
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
        <div className="w-full grow overflow-auto">{children}</div>
      </div>
    </Draggable>
  )
}

export default Window
