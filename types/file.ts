const enum FileType {
  File,
  Directory,
  Other,
}

type FileOrDirectory = {
  name: string
  type: FileType
  files?: FileOrDirectory[]
}

export type { FileOrDirectory }
export { FileType }
