const enum FileType {
  File,
  Directory,
  Other,
}

const enum FileError {
  NoSuchFileOrDirectory = 'no such file or directory',
  NotADirectory = 'not a directory',
}

type FileOrDirectory = {
  name: string
  type: FileType
  files?: FileOrDirectory[]
}

export type { FileOrDirectory }
export { FileType, FileError }
