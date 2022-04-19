import { APIResponse } from '../types/api'

const getFiles = (path: string[]): Promise<APIResponse> => {
  return fetch('/api/files/' + path.join('/')).then((res) => res.json())
}

const getFileContents = (path: string[]): Promise<APIResponse> => {
  return fetch('/api/file/' + path.join('/')).then((res) => res.json())
}

export { getFiles, getFileContents }
