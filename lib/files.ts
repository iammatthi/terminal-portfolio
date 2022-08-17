import { APIResponse } from '@customtypes/api'

const getFiles = (path: string[]): Promise<APIResponse> => {
  return fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/files/` + path.join('/')
  ).then((res) => res.json())
}

const getFileContents = (path: string[]): Promise<APIResponse> => {
  return fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/file/` + path.join('/')
  ).then((res) => res.json())
}

export { getFiles, getFileContents }
