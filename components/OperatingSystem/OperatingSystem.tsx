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
  closeWindow: (proc: number) => void
  getProc: () => number
}>({
  windows: [],
  openWindow: () => {},
  closeWindow: () => {},
  getProc: () => {
    return -1
  },
}) // FIXME: change type

const OperatingSystem: FC = ({ children }) => {
  let procCounter = 0

  const [windows, setWindows] = useState<JSX.Element[]>([])

  const openWindow = (window: JSX.Element) => {
    setWindows((prevWindows) => {
      return [...prevWindows, window]
    })
  }

  const closeWindow = (proc: number) => {
    setWindows((prevWindows) => {
      return prevWindows.filter((window) => window.props.proc !== proc)
    })
  }

  const getProc = () => {
    return procCounter++
  }

  const value = useMemo(
    () => ({ windows, openWindow, closeWindow, getProc }),
    [windows]
  )

  return (
    <WindowsContext.Provider value={value}>{children}</WindowsContext.Provider>
  )
}

export { OperatingSystem, WindowsContext }
