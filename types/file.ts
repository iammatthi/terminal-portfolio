const enum NodeType {
  File,
  Directory,
  Other,
}

const enum FileExtension {
  Markdown = 'md',
  Text = 'txt',
  Other = '',
}

const enum FileError {
  NoSuchFileOrDirectory = 'no such file or directory',
  NotADirectory = 'not a directory',
  NotAFile = 'not a file',
}

type Node = {
  name: string
  type: NodeType
  files?: Node[]
}

export type { Node }
export { NodeType, FileError, FileExtension }
