import { getAllPaths } from '@lib/paths'
import type { NextApiRequest, NextApiResponse } from 'next'
import { APIResponse } from '../../../types/api'

export default (req: NextApiRequest, res: NextApiResponse<APIResponse>) => {
  res.status(200).json({ data: getAllPaths() })
}
