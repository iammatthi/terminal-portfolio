import { APIResponse } from '../types/api'

const getPathSymbol = (path: string[]) => {
  if (path.length === 0) return '~'
  return path[path.length - 1]
}

const pathToString = (path: string[]) => {
  let filePath = ['_files']
  if (path !== undefined) {
    filePath = ['_files', ...path]
  }
  return filePath.join('/')
}

const getAllPaths = (): Promise<APIResponse> => {
  return fetch('http://localhost:3000/api/paths/').then((res) => res.json())
}

export { getPathSymbol, pathToString, getAllPaths }
