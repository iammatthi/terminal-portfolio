const getPathSymbol = (path: string[]) => {
  if (path.length === 0) return '~'
  return path[path.length - 1]
}

const pathToString = (path: string[]) => {
  if (path === undefined) return ''
  return path.join('/')
}

export { getPathSymbol, pathToString }
