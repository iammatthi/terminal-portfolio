const enum FileType {
  file,
  directory,
  other,
}

type FileOrDirectory = {
  name: string
  type: FileType
  files?: FileOrDirectory[]
}

export type { FileOrDirectory }
export { FileType }
