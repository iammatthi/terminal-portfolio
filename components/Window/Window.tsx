import { FC, useRef } from 'react'
import Draggable from 'react-draggable'
import {
  VscChromeClose,
  VscChromeMaximize,
  VscChromeMinimize,
} from 'react-icons/vsc'
import cn from 'classnames'
import s from './Window.module.css'

interface Props {
  title?: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  draggable?: boolean
  onClose?: () => void
  onMaximize?: () => void
  onMinimize?: () => void
}

const Window: FC<Props> = ({
  title,
  children,
  className,
  draggable,
  onClose,
  onMaximize,
  onMinimize,
  style,
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
      <div className={cn(s.root, className)} style={{ ...style }} ref={nodeRef}>
        <div className={cn(s.header, 'header')} style={{ height: '50px' }}>
          <div className={cn(s.headerTitle)}>
            <span className={cn(s.headerTitleText)}>{title}</span>
          </div>
          <div className={cn(s.headerButtons)}>
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
