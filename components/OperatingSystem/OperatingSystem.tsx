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
  let processCounter = 0

  const [windows, setWindows] = useState<JSX.Element[]>([])

  const openWindow = (window: JSX.Element) => {
    setWindows((prevWindows) => {
      return [...prevWindows, window]
    })
  }

  const closeWindow = (process: number) => {
    setWindows((prevWindows) => {
      return prevWindows.filter((window) => window.props.process !== process)
    })
  }

  const getProcess = () => {
    return processCounter++
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
