const getPathSymbol = (path: string[]) => {
  if (path.length === 0) return '~'
  return path[path.length - 1]
}

export { getPathSymbol }
