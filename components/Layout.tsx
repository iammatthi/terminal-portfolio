import { FC } from 'react'

interface Props {
  children: React.ReactNode
}

const Layout: FC<Props> = ({ children }) => {
  return <main className="fit">{children}</main>
}

export default Layout
