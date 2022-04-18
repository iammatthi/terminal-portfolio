import { KeyboardEvent, useEffect, useRef, useState } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import {
  VscChromeClose,
  VscChromeMaximize,
  VscChromeMinimize,
} from 'react-icons/vsc'
import { TiArrowRightThick } from 'react-icons/ti'
import { parse as cmdParse, ParseEntry } from 'shell-quote'
import getopts from 'getopts'
import { getFiles } from '../utils/files'
import { FileOrDirectory, FileType } from '../types/file'

const useFiles = (path: string[]) => {
  const [files, setFiles] = useState<FileOrDirectory[]>([])

  useEffect(() => {
    getFiles(path).then((files) => {
      if (!files.error) setFiles(files.data)
    })
  }, [path])

  return files
}

export { useFiles }
