import {
  createContext,
  Dispatch,
  FC,
  SetStateAction,
  useMemo,
  useState,
} from 'react'

const WindowsContext = createContext<{
  windows: JSX.Element[]
  openWindow: (window: JSX.Element) => void
  closeWindow: (process: number) => void
  getProcess: () => number
}>({
  windows: [],
  openWindow: () => {},
  closeWindow: () => {},
  getProcess: () => {
    return -1
  },
}) // FIXME: change type

const OperatingSystem: FC = ({ children }) => {
  const [processCounter, setProcessCounter] = useState<number>(0)

  const [windows, setWindows] = useState<JSX.Element[]>([])

  const openWindow = (window: JSX.Element) => {
    setWindows((prevWindows) => {
      return [...prevWindows, window]
    })
  }

  const closeWindow = (process: number) => {
    setWindows((prevWindows) =>
      prevWindows.filter((window) => window.props.process !== process)
    )
  }

  const getProcess = () => {
    let value = processCounter
    setProcessCounter(processCounter + 1)
    return value
  }

  const value = useMemo(
    () => ({ windows, openWindow, closeWindow, getProcess }),
    [windows]
  )

  return (
    <WindowsContext.Provider value={value}>{children}</WindowsContext.Provider>
  )
}

export { OperatingSystem, WindowsContext }
