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
import { getFiles } from '../lib/files'
import { FileOrDirectory, FileType } from '../types/file'

type History = {
  input: string
  result: JSX.Element | string
  path: string[]
  timestamp: string
}

enum GetoptsType {
  string = 'string',
  boolean = 'boolean',
}
type Option = {
  name: string
  description: string
  getoptsType: GetoptsType
}

type Operand = {
  name: string
  description: string
}

type Command = {
  name: string
  description: string
  operands: Operand[]
  options: Option[]
  handler: (args: getopts.ParsedOptions) => JSX.Element | string
}

interface Props {
  files: FileOrDirectory[]
}

export async function getStaticProps() {
  return {
    props: {
      files: getFiles(),
    },
  }
}

const Home: NextPage<Props> = ({ files: allFiles }) => {
  const commandsEndRef = useRef<null | HTMLDivElement>(null)

  const scrollToBottom = () => {
    commandsEndRef.current?.scrollIntoView({ behavior: 'auto' })
  }

  const [path, setPath] = useState(['_files'])

  const getPathSymbol = (path: string[]) => {
    if (path.length === 1) return '~'
    return path[path.length - 1]
  }

  const getFilesInPath = (path: string[]) => {
    if (path.length === 1) return allFiles

    let currFiles
    for (let i = 1; i < path.length; i++) {
      const file = allFiles.find((file) => file.name === path[i])
      if (file && file.type === FileType.Directory) {
        currFiles = file.files
      }
    }
    if (!currFiles) return []
    return currFiles
  }

  const [files, setFiles] = useState(getFilesInPath(path))

  const commands: Command[] = [
    {
      name: 'help',
      description: 'print help',
      operands: [],
      options: [],
      handler: (args) => {
        const help = (
          <>
            {commands.map((command) => (
              <div key={command.name}>
                <span>
                  {command.name} - {command.description}
                </span>
                {/* {command.operands.map((operand) => (
                  <>
                    <span className="ml-4">
                      {operand.name} - {operand.description}
                    </span>
                  </>
                ))}
                {command.options.map((option) => (
                  <>
                    <span className="ml-4">
                      {option.name} - {option.description}
                    </span>
                  </>
                ))}
                <br /> */}
              </div>
            ))}
          </>
        )
        return help
      },
    },
    {
      name: 'echo',
      description: 'display a line of text',
      operands: [
        {
          name: 'text',
          description: 'the text to display',
        },
      ],
      options: [],
      handler: (args) => {
        return args._[0]
      },
    },
    {
      name: 'ls',
      description: 'list directory contents',
      operands: [],
      options: [
        {
          name: 'l',
          description: 'use a long listing format',
          getoptsType: GetoptsType.boolean,
        },
      ],
      handler: (args) => {
        let currentPathFiles = files
        if (!args.a) {
          // remove hidden files
          currentPathFiles = currentPathFiles.filter(
            (file) => !file.name.startsWith('.')
          )
        }
        if (args.l) {
          return (
            <>
              {currentPathFiles.map((file) => (
                <div key={file.name}>
                  <div className="flex gap-3">
                    <span>-rwxr--r--</span>
                    <span>matthias</span>
                    <span>matthias</span>
                    {file.type === FileType.Directory ? (
                      <span className="text-sky-600">{file.name}</span>
                    ) : (
                      <span>{file.name}</span>
                    )}
                  </div>
                </div>
              ))}
            </>
          )
        } else {
          return (
            <div className="flex flex-wrap gap-4">
              {currentPathFiles.map((file) => (
                <>
                  {file.type === FileType.Directory ? (
                    <span className="text-sky-600">{file.name}</span>
                  ) : (
                    <span>{file.name}</span>
                  )}
                </>
              ))}
            </div>
          )
        }
      },
    },
    {
      name: 'cd',
      description: 'change the working directory',
      operands: [
        {
          name: 'directory',
          description: 'the directory to change to',
        },
      ],
      options: [],
      handler: (args) => {
        // change directory to args._[0]
        const inputPath = args._[0]
        if (inputPath === undefined) {
          setPath(['_files'])
          setFiles(allFiles)
        } else if (inputPath === '..') {
          if (path.length > 1) {
            const newPath = path.slice(0, -1)
            setPath(newPath)
            setFiles(getFilesInPath(newPath))
          }
        } else if (inputPath === '.') {
          // do nothing
        } else {
          const newPath = [...path, ...inputPath.split('/')]
          const filesInPath = getFilesInPath(newPath)
          const newPathFiles = filesInPath.filter(
            (file) => file.name === newPath[newPath.length - 1]
          )
          if (newPathFiles.length === 0) {
            // do not exist
            return `cd: no such file or directory: ${inputPath}`
          } else if (newPathFiles[0].type !== FileType.Directory) {
            // not a directory
            return `cd: not a directory: ${inputPath}`
          }
          setPath(newPath)
          setFiles(newPathFiles[0].files!)
        }
        return ''
      },
    },
  ]

  const [commandHistory, setCommandHistory] = useState<History[]>([
    {
      input: 'help',
      result: commands.find((c) => c.name === 'help')!.handler({ _: [] }),
      path: path,
      timestamp: '2020-01-01T00:00:00.000Z',
    },
  ])

  useEffect(() => {
    scrollToBottom()
  }, [commandHistory])

  const cmd = (input: string) => {
    const [command, ...args] = cmdParse(input)
    if (command == undefined) return ''

    const commandObj = commands.find((c) => c.name === command)
    if (commandObj) {
      const rules: getopts.Options = commandObj.options.reduce((prev, curr) => {
        if (curr.getoptsType in prev) prev[curr.getoptsType].push(curr.name)
        else prev[curr.getoptsType] = [curr.name]
        return prev
      }, {} as { [key in GetoptsType]: string[] })

      const paramObj = getopts(
        args.map((entry: ParseEntry) => entry.toString()),
        rules
      )

      return commandObj.handler(paramObj)
    }
    return 'command not found: ' + command
  }

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      const input = event.currentTarget.value
      const result = cmd(input)
      setCommandHistory([
        ...commandHistory,
        {
          input: input,
          result: result,
          path: path,
          timestamp: new Date().toISOString(),
        },
      ])
      event.currentTarget.value = ''
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Head>
        <title>Matthias Berchtold</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex w-full flex-1 flex-col items-center justify-center bg-black px-20 text-center">
        <div
          className="text-s flex flex-col text-white"
          style={{ width: '735px', height: '480px' }}
        >
          <div
            className="relative flex w-full cursor-default items-center justify-center rounded-t-lg bg-zinc-800 p-5"
            style={{ height: '50px' }}
          >
            <span>matthias@portfolio:~</span>
            <div className="absolute right-0 flex flex-row gap-8 p-5">
              <button>
                <VscChromeMinimize />
              </button>
              <button>
                <VscChromeMaximize />
              </button>
              <button>
                <VscChromeClose />
              </button>
            </div>
          </div>
          <div className="w-full grow cursor-text overflow-auto bg-zinc-700 px-1 py-2">
            {commandHistory.map((command) => (
              <div
                className="flex flex-col items-start"
                key={command.timestamp}
              >
                <div className="flex items-center gap-2">
                  <TiArrowRightThick color="green" />
                  <span className="text-teal-500">
                    {getPathSymbol(command.path)}
                  </span>
                  <span>{command.input}</span>
                </div>
                <div className="flex w-full flex-col items-start justify-start">
                  {command.result}
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <TiArrowRightThick color="green" />
              <span className="text-teal-500">{getPathSymbol(path)}</span>
              <div className="relative grow">
                <input
                  className="w-full border-0 bg-transparent outline-0"
                  onKeyPress={handleKeyPress}
                ></input>
                {/* <i className="caret"></i> */}
              </div>
            </div>
            <div ref={commandsEndRef} />
          </div>
        </div>
      </main>
    </div>
  )
}

export default Home
