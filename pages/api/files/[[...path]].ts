import fs from 'fs'
import path from 'path'
import type { NextApiRequest, NextApiResponse } from 'next'
import { FileError, FileOrDirectory, FileType } from '../../../types/file'
import { APIResponse } from '../../../types/api'
import { pathToString } from '../../../lib/path'

export default (req: NextApiRequest, res: NextApiResponse<APIResponse>) => {
  const filePathStr = pathToString(req.query.path as string[])
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
