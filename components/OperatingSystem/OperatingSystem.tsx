import { createContext, FC, useMemo, useState } from 'react'
import { App } from '../../types/apps'
import Browser from '../apps/Browser'
import Terminal from '../apps/Terminal'
import TextViewer from '../apps/TextViewer'

type Process = {
  id: number
  order: number
  window: JSX.Element
}

type Props = {
  processes: Process[]
  openWindow: (app: App, data: any, position?: any) => void
  closeWindow: (processId: number) => void
  getNewProcessId: () => number
  focus: (processId: number) => void
  getOrder: (processId: number) => number
}

const WindowsContext = createContext<Props>({
  processes: [],
  openWindow: () => {},
  closeWindow: () => {},
  getNewProcessId: () => {
    return -1
  },
  focus: () => {},
  getOrder: () => {
    return -1
  },
})

const OperatingSystem: FC = ({ children }) => {
  const [processCounter, setProcessCounter] = useState<number>(0)

  const [processes, setProcesses] = useState<Process[]>([])

  const openWindow = (app: App, data: any, callerPosition?: any) => {
    const procId = getNewProcessId()
    const defaultPosition = callerPosition
      ? { x: callerPosition.x + 30, y: callerPosition.y + 60 }
      : { x: 0, y: 0 }

    console.log(defaultPosition, callerPosition)

    let window: JSX.Element
    switch (app) {
      case App.Browser:
        window = (
          <Browser
            draggable
            processId={procId}
            data={data}
            defaultPosition={defaultPosition}
          />
        )
        break
      case App.Terminal:
        window = (
          <Terminal
            draggable
            processId={procId}
            defaultPosition={defaultPosition}
          />
        )
        break
      case App.TextViewer:
        window = (
          <TextViewer
            draggable
            processId={procId}
            data={data}
            defaultPosition={defaultPosition}
          />
        )
        break
      default:
        return
    }

    setProcesses((prev) => [
      ...prev,
      {
        id: window.props.processId,
        order: processCounter,
        window: window,
      },
    ])
  }

  const closeWindow = (processId: number) => {
    setProcesses((prevProcesses) =>
      prevProcesses.filter((process) => process.id !== processId)
    )
  }

  const getNewProcessId = () => {
    const value = processCounter
    setProcessCounter((prev) => prev + 1)
    return value
  }

  const focus = (processId: number) => {
    console.log('FOCUS', processId, processCounter)
    setProcesses((prevProcesses) =>
      prevProcesses.map((process) => {
        if (process.id === processId) {
          process.order = processCounter
          setProcessCounter((prev) => prev + 1)
        }
        return process
      })
    )
  }

  const getOrder = (processId: number) => {
    const process = processes.find((process) => process.id === processId)
    return process ? process.order : 0
  }

  const value = useMemo(
    () => ({
      processes,
      openWindow,
      closeWindow,
      getNewProcessId,
      focus,
      getOrder,
    }),
    [processes]
  )

  return (
    <WindowsContext.Provider value={value}>{children}</WindowsContext.Provider>
  )
}

export { OperatingSystem, WindowsContext }
