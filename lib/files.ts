import { APIResponse } from '../types/api'

const getFiles = (path: string[]): Promise<APIResponse> => {
  return fetch('http://localhost:3000/api/files/' + path.join('/')).then(
    (res) => res.json()
  )
}

const getFileContents = (path: string[]): Promise<APIResponse> => {
  return fetch('http://localhost:3000/api/file/' + path.join('/')).then((res) =>
    res.json()
  )
}

export { getFiles, getFileContents }
