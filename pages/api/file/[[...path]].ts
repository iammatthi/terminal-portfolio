import { APIResponse } from '@customtypes/api'
import { FileError } from '@customtypes/file'
import { pathToString } from '@lib/path'
import fs from 'fs'
import type { NextApiRequest, NextApiResponse } from 'next'
import path from 'path'

export default (req: NextApiRequest, res: NextApiResponse<APIResponse>) => {
  const filePathStr = pathToString(req.query.path as string[])
  const file = path.join(process.cwd(), 'contents/', filePathStr)

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
