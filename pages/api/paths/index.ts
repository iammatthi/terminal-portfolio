import fs from 'fs'
import path from 'path'
import type { NextApiRequest, NextApiResponse } from 'next'
import { APIResponse } from '../../../types/api'

const getAllPaths = (startPath = '') => {
  const dir = path.resolve('./public/_files/', startPath)
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

export default (req: NextApiRequest, res: NextApiResponse<APIResponse>) => {
  res.status(200).json({ data: getAllPaths() })
}
