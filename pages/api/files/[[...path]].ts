import fs from 'fs'
import path from 'path'
import type { NextApiRequest, NextApiResponse } from 'next'
import { FileError, FileOrDirectory, FileType } from '../../../types/file'
import { APIResponse } from '../../../types/api'

export default (req: NextApiRequest, res: NextApiResponse<APIResponse>) => {
  const { path: tmp } = req.query
  let filePath = ['_files']
  if (tmp !== undefined) {
    filePath = ['_files', ...(tmp as string[])]
  }
  const filePathStr = filePath.join('/')
  const dir = path.resolve('./public', filePathStr)

  if (!fs.existsSync(dir)) {
    res.status(404).json({ error: true, data: FileError.NoSuchFileOrDirectory })
    return
  }

  if (!fs.lstatSync(dir).isDirectory()) {
    res.status(500).json({ error: true, data: FileError.NotADirectory })
    return
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true })

  // Get files within the current directory
  const files: FileOrDirectory[] = entries.map((file) => ({
    name: file.name,
    type: file.isFile()
      ? FileType.File
      : file.isDirectory()
      ? FileType.Directory
      : FileType.Other,
  }))

  files.push({
    name: '..',
    type: FileType.Directory,
  })

  files.push({
    name: '.',
    type: FileType.Directory,
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

  res.status(200).json({ data: files })
}

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
