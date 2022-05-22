import { useEffect, useState } from 'react'
import { getFiles } from '../lib/files'
import { FileOrDirectory, FileType } from '../types/file'

const useFiles = (path: string[]) => {
  const [files, setFiles] = useState<FileOrDirectory[]>([])

  useEffect(() => {
    getFiles(path).then((files) => {
      if (!files.error) setFiles(files.data)
    })
  }, [path])

  return files
}

export { useFiles }
