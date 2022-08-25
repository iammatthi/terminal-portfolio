// FIXME: should be in the same file as the other path utils

import fs from 'fs'
import path from 'path'

const getDir = (dirPath: string) => {
  console.log('SIUM', dirPath)
  // return path.resolve('public/', '_files/', dirPath)
  return path.resolve(process.cwd(), '_files/', dirPath)
}

const getAllPaths = (startPath = ''): string[] => {
  const dir = getDir(startPath)
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  // Get files within the current directory
  let paths: string[] = entries
    .filter((file) => !file.isDirectory())
    .map((file) => (startPath === '' ? file.name : startPath + '/' + file.name))

  // Get folders within the current directory
  const folders = entries.filter((folder) => folder.isDirectory())

  // Add the found files within the subdirectory to the files array by calling the current function itself
  for (const folder of folders)
    paths = [
      ...paths,
      ...getAllPaths(
        startPath === '' ? folder.name : startPath + '/' + folder.name
      ),
    ]

  return paths
}

export { getAllPaths, getDir }
