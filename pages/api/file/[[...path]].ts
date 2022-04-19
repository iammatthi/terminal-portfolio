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
  const file = path.resolve('./public', filePathStr)

  if (!fs.existsSync(file)) {
    res.status(404).json({ error: true, data: FileError.NoSuchFileOrDirectory })
    return
  }

  if (!fs.lstatSync(file).isFile()) {
    res.status(500).json({ error: true, data: FileError.NotAFile })
    return
  }

  const data = fs.readFileSync(file, { encoding: 'utf8', flag: 'r' })

  res.status(200).json({ data: data })
}
