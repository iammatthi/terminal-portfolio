import Browser from '@apps/Browser'
import Terminal from '@apps/Terminal'
import TextViewer from '@apps/TextViewer'
import { App } from '@customtypes/apps'
import { createContext, FC, useMemo, useState } from 'react'

type Process = {
  id: number
  window: JSX.Element
}

type Props = {
  processes: Process[]
  processHistory: number[]
  openWindow: (app: App, data: any, position?: any) => void
  closeWindow: (processId: number) => void
  getNewProcessId: () => number
  focusWindow: (processId: number) => void
  getOrder: (processId: number) => number
}

const WindowsContext = createContext<Props>({
  processes: [],
  processHistory: [],
  openWindow: () => {},
  closeWindow: () => {},
  getNewProcessId: () => {
    return -1
  },
  focusWindow: () => {},
  getOrder: () => {
    return -1
  },
})

const OperatingSystem: FC = ({ children }) => {
  const [processes, setProcesses] = useState<Process[]>([])
  const [processHistory, setProcessHistory] = useState<number[]>([])
  const [processCounter, setProcessCounter] = useState<number>(1)

  const openWindow = (app: App, data: any, callerPosition?: any) => {
    const procId = getNewProcessId()
    const defaultPosition = callerPosition
      ? { x: callerPosition.x + 30, y: callerPosition.y + 60 }
      : { x: 0, y: 0 }

    let window: JSX.Element
    switch (app) {
      case App.Browser:
        window = (
          <Browser
            processId={procId}
            data={data}
            defaultPosition={defaultPosition}
            draggable
          />
        )
        break
      case App.Terminal:
        window = (
          <Terminal
            processId={procId}
            defaultPosition={defaultPosition}
            draggable
          />
        )
        break
      case App.TextViewer:
        window = (
          <TextViewer
            processId={procId}
            data={data}
            defaultPosition={defaultPosition}
            draggable
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
    setProcessHistory((prev) => [...prev, procId])
  }

  const closeWindow = (processId: number) => {
    setProcesses((prevProcesses) =>
      prevProcesses.filter((process) => process.id !== processId)
    )
    setProcessHistory((prevHistory) =>
      prevHistory.filter((id) => id !== processId)
    )
  }

  const getNewProcessId = () => {
    const value = processCounter
    setProcessCounter((prev) => prev + 1)
    return value
  }

  const focusWindow = (processId: number) => {
    // Move current process at the end of the process history array
    setProcessHistory((prevHistory) => {
      const index = prevHistory.indexOf(processId)
      if (index > -1) {
        const newHistory = [...prevHistory]
        newHistory.splice(index, 1)
        newHistory.push(processId)
        return newHistory
      }
      return prevHistory
    })
  }

  const getOrder = (processId: number) => {
    // Return index of process in processes array
    return processHistory.indexOf(processId)
  }

  const value = useMemo(
    () => ({
      processes,
      processHistory,
      openWindow,
      closeWindow,
      getNewProcessId,
      focusWindow,
      getOrder,
    }),
    [processes, processHistory]
  )

  return (
    <WindowsContext.Provider value={value}>{children}</WindowsContext.Provider>
  )
}

export { OperatingSystem, WindowsContext }
