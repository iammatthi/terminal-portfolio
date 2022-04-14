import { KeyboardEvent, useState } from 'react'
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
  command: string
  result: JSX.Element | string
  path: string
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

const Home: NextPage<Props> = ({ files }) => {
  const [path, setPath] = useState('_files/')

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
                    {file.type === FileType.directory ? (
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
                  {file.type === FileType.directory ? (
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
  ]

  const [history, setHistory] = useState<History[]>([
    {
      command: 'help',
      result: commands.find((c) => c.name === 'help')!.handler({ _: [] }),
      path: '~',
      timestamp: '2020-01-01T00:00:00.000Z',
    },
  ])

  const cmd = (input: string) => {
    const [command, ...args] = cmdParse(input)
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

  const getPathSymbol = (path: string) => {
    return path
  }

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      const command = event.currentTarget.value
      const result = cmd(command)
      setHistory([
        ...history,
        { command, result, path: '~', timestamp: new Date().toISOString() },
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
            {history.map((command) => (
              <div
                className="flex flex-col items-start"
                key={command.timestamp}
              >
                <div className="flex items-center gap-2">
                  <TiArrowRightThick color="green" />
                  <span className="text-teal-500">
                    {getPathSymbol(command.path)}
                  </span>
                  <span>{command.command}</span>
                </div>
                <div className="flex w-full flex-col items-start justify-start">
                  {command.result}
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <TiArrowRightThick color="green" />
              <span className="text-teal-500">~</span>
              <div className="relative grow">
                <input
                  className="w-full border-0 bg-transparent outline-0"
                  onKeyPress={handleKeyPress}
                ></input>
                {/* <i className="caret"></i> */}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Home
