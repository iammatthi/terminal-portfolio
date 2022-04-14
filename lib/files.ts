import fs from 'fs'
import { FileOrDirectory, FileType } from '../types/file'

const getFiles = (path = '_files/') => {
  const entries = fs.readdirSync(path, { withFileTypes: true })

  // Get files within the current directory
  const files: FileOrDirectory[] = entries
    .filter((file) => !file.isDirectory())
    .map((file) => ({
      name: file.name,
      type: file.isFile()
        ? FileType.file
        : file.isDirectory()
        ? FileType.directory
        : FileType.other,
    }))

  // Get folders within the current directory
  const folders = entries.filter((folder) => folder.isDirectory())

  // Add the found files within the subdirectory to the files array by calling the current function itself
  for (const folder of folders)
    files.push({
      name: folder.name,
      type: FileType.directory,
      files: getFiles(path + folder.name + '/'),
    })

  return files
}

export { getFiles }
