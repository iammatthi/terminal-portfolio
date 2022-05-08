import { FC, useContext } from 'react'
import { TableElement } from '../../types/table'

interface Props {
  data: TableElement[]
}

const Table: FC<Props> = ({ data }) => {
  return (
    <div className="flex flex-wrap gap-4">
      {data.map((element) => (
        <div key={element.name}>
          <span className={element.className}>{element.name}</span>
        </div>
      ))}
    </div>
  )
}

export default Table
