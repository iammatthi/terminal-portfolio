import { APIResponse } from '@customtypes/api'
import { FileError, Node, NodeType } from '@customtypes/file'
import { pathToString } from '@lib/path'
import fs from 'fs'
import type { NextApiRequest, NextApiResponse } from 'next'
import path from 'path'

export default (req: NextApiRequest, res: NextApiResponse<APIResponse>) => {
  const filePathStr = pathToString(req.query.path as string[])
  // const dir = getDir(filePathStr)
  const dir = path.join(process.cwd(), 'contents/', filePathStr)

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
  const files: Node[] = entries.map((file) => ({
    name: file.name,
    type: file.isFile()
      ? NodeType.File
      : file.isDirectory()
      ? NodeType.Directory
      : NodeType.Other,
  }))

  files.push({
    name: '..',
    type: NodeType.Directory,
  })

  files.push({
    name: '.',
    type: NodeType.Directory,
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
