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
import { FileError, FileType } from '../types/file'
import { getPathSymbol } from '../utils/path'
import { useFiles } from '../hooks/usePath'

type CommandResult = {
  output: JSX.Element | string
  error?: boolean
  shouldBeInvisible?: boolean
}

type History = {
  input: string
  result: CommandResult
  path: string[]
  timestamp: string
  isInvisible?: boolean
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
  handler: (args: getopts.ParsedOptions) => Promise<CommandResult>
}

const Home: NextPage = () => {
  const commandsEndRef = useRef<null | HTMLDivElement>(null)
  const commandInputRef = useRef<null | HTMLInputElement>(null)

  const [path, setPath] = useState<string[]>([])
  const files = useFiles(path)

  const commands: Command[] = [
    {
      name: 'help',
      description: 'print help',
      operands: [],
      options: [],
      handler: async (args) => {
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
        return { output: help }
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
      handler: async (args) => {
        return { output: args._.join(' ') }
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
        {
          name: 'a',
          description: 'do not ignore entries starting with .',
          getoptsType: GetoptsType.boolean,
        },
        {
          name: 'A',
          description: 'do not list implied . and ..',
          getoptsType: GetoptsType.boolean,
        },
      ],
      handler: async (args) => {
        let filteredFiles = files

        if (args.A) {
          // remove . and ..
          filteredFiles = filteredFiles.filter(
            (file) => !['.', '..'].includes(file.name)
          )
        } else if (!args.a) {
          // remove hidden files
          filteredFiles = filteredFiles.filter(
            (file) => !file.name.startsWith('.')
          )
        }

        let output
        if (args.l) {
          output = (
            <>
              {filteredFiles.map((file) => (
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
          output = (
            <div className="flex flex-wrap gap-4">
              {filteredFiles.map((file) => (
                <div key={file.name}>
                  {file.type === FileType.Directory ? (
                    <span className="text-sky-600">{file.name}</span>
                  ) : (
                    <span>{file.name}</span>
                  )}
                </div>
              ))}
            </div>
          )
        }

        return { output: output }
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
      handler: async (args) => {
        // change directory to args._[0]
        const inputPath = args._[0]
        if (inputPath === undefined) {
          setPath([])
        } else if (inputPath === '..') {
          if (path.length > 0) {
            const newPath = path.slice(0, -1)
            setPath(newPath)
          }
        } else if (inputPath === '.') {
          // do nothing
        } else {
          const newPath = [...path, ...inputPath.split('/')]
          const filesInPath = await getFiles(newPath)
          if (filesInPath.error) {
            if (filesInPath.data === FileError.NoSuchFileOrDirectory) {
              // do not exist
              return {
                output: `cd: no such file or directory: ${inputPath}`,
                error: true,
              }
            } else if (filesInPath.data === FileError.NotADirectory) {
              // not a directory
              return {
                output: `cd: not a directory: ${inputPath}`,
                error: true,
              }
            } else {
              return {
                output: `cd: error`,
                error: true,
              }
            }
          }

          setPath(newPath)
        }

        return { output: '' }
      },
    },
    {
      name: 'clear',
      description: 'clear the terminal screen',
      operands: [],
      options: [],
      handler: async (args) => {
        // make all commandHistory items invisible
        let tmp = commandHistory
        tmp.forEach((item) => (item.isInvisible = true))
        setCommandHistory(tmp)
        return { output: '', shouldBeInvisible: true }
      },
    },
    {
      name: 'alias',
      description: 'show aliases',
      operands: [],
      options: [],
      handler: async (args) => {
        const output = (
          <>
            {Object.keys(aliases).map((alias) => (
              <div key={alias}>
                <span>
                  {alias}='{aliases[alias]}'
                </span>
              </div>
            ))}
          </>
        )
        return { output: output }
      },
    },
  ]

  const aliases: { [key: string]: string } = {
    '..': 'cd ..',
    l: 'ls -lah',
    la: 'ls -lAh',
    ll: 'ls -lh',
    lsa: 'ls -lah',
  }

  const [commandHistory, setCommandHistory] = useState<History[]>([])
  // commands
  //   .find((c) => c.name === 'help')!
  //   .handler({ _: [] })
  //   .then((result) => {
  //     setCommandHistory([
  //       {
  //         input: 'help',
  //         result: result,
  //         path: path,
  //         timestamp: '2020-01-01T00:00:00.000Z',
  //       },
  //     ])
  //   })

  const executeCmd = async (input: string): Promise<CommandResult> => {
    let command: ParseEntry, args: ParseEntry[]

    while (true) {
      ;[command, ...args] = cmdParse(input) // FIXME: formatter adds semicolon
      if (command == undefined) return { output: '', shouldBeInvisible: false }

      if (aliases[command.toString()])
        input = input.replace(command.toString(), aliases[command.toString()])
      else break
    }

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
    return {
      output: 'command not found: ' + command,
    }
  }

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      const input = event.currentTarget.value
      executeCmd(input).then((result) => {
        setCommandHistory([
          ...commandHistory,
          {
            input: input,
            result: result,
            path: path,
            timestamp: new Date().toISOString(),
            isInvisible: result.shouldBeInvisible,
          },
        ])
      })
      event.currentTarget.value = ''
    }
  }

  const handleWindowContentClick = () => {
    commandInputRef.current?.focus()
  }

  const scrollToBottom = () => {
    commandsEndRef.current?.scrollIntoView({ behavior: 'auto' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [commandHistory])

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
          <div
            className="w-full grow cursor-text overflow-auto bg-zinc-700 px-1 py-2"
            onClick={handleWindowContentClick}
          >
            {commandHistory
              .filter((command) => !command.isInvisible)
              .map((command) => (
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
                    {command.result.output}
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
                  ref={commandInputRef}
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
