import fs from 'fs'
import { FileOrDirectory, FileType } from '../types/file'

const getFiles = (path = '_files') => {
  const entries = fs.readdirSync(path, { withFileTypes: true })

  // Get files within the current directory
  const files: FileOrDirectory[] = entries
    .filter((file) => !file.isDirectory())
    .map((file) => ({
      name: file.name,
      type: file.isFile()
        ? FileType.File
        : file.isDirectory()
        ? FileType.Directory
        : FileType.Other,
    }))

  // Get folders within the current directory
  const folders = entries.filter((folder) => folder.isDirectory())

  // Add the found files within the subdirectory to the files array by calling the current function itself
  for (const folder of folders)
    files.push({
      name: folder.name,
      type: FileType.Directory,
      files: getFiles(`${path}/${folder.name}`),
    })

  files.push({
    name: '..',
    type: FileType.Directory,
    files: [],
  })

  files.push({
    name: '.',
    type: FileType.Directory,
    files: [],
  })

  // order files
  files.sort((a, b) =>
    a.name
      .replace(/^\./, '')
      .localeCompare(b.name.replace(/^\./, ''), undefined, {
        numeric: true,
        sensitivity: 'base',
      })
  )

  return files
}

export { getFiles }
