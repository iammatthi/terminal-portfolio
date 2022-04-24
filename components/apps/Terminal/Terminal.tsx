import {
  FC,
  KeyboardEvent,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { TiArrowRightThick } from 'react-icons/ti'
import { parse as cmdParse, ParseEntry } from 'shell-quote'
import getopts from 'getopts'
import { getFiles, getFileContents } from '../../../lib/files'
import { FileError, FileExtension, FileType } from '../../../types/file'
import { getPathSymbol } from '../../../lib/path'
import { useFiles } from '../../../hooks/useFiles'
import {
  Command,
  CommandHistory,
  CommandResult,
  GetoptsType,
} from '../../../types/command'
import Window from '../../Window'
import { WindowsContext } from '../../OperatingSystem'
import Browser from '../Browser'
import TextViewer from '../TextViewer'

const Terminal: FC = () => {
  const commandsEndRef = useRef<null | HTMLDivElement>(null)
  const commandInputRef = useRef<null | HTMLInputElement>(null)
  const { windows, openWindow, getProc } = useContext(WindowsContext)

  const [path, setPath] = useState<string[]>([])
  const files = useFiles(path)

  const commands: Command[] = [
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
                output: `cd: Error`,
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
      name: 'help',
      description: 'print help',
      operands: [],
      options: [],
      handler: async (args) => {
        // sort commands by name
        const help = (
          <>
            {commands.map((command) => (
              <div key={command.name}>
                <span>
                  {command.name} - {command.description}
                </span>
              </div>
            ))}
          </>
        )
        return { output: help }
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
      name: 'cat',
      description: 'concatenate files and print on the standard output',
      operands: [
        {
          name: 'file(s)',
          description: 'Concatenate FILE(s) to standard output.',
        },
      ],
      options: [],
      handler: async (args) => {
        const filesToConcat = args._
        if (filesToConcat.length === 0) {
          return {
            output: 'cat: Missing operand',
            error: true,
          }
        }

        let output = ''
        for (const file of filesToConcat) {
          const fileContents = await getFileContents([...path, file])
          if (fileContents.error) {
            if (fileContents.data === FileError.NoSuchFileOrDirectory) {
              // do not exist
              return {
                output: `cat: ${file}: No such file or directory`,
                error: true,
              }
            } else if (fileContents.data === FileError.NotAFile) {
              // not a file
              return {
                output: `cat: ${file}: Is a directory`,
                error: true,
              }
            } else {
              return {
                output: `cat: Error`,
                error: true,
              }
            }
          }
          output += fileContents.data
        }

        return { output: <span className="whitespace-pre-wrap">{output}</span> }
      },
    },
    {
      name: 'xdg-open',
      description: "opens a file in the user's preferred application",
      operands: [
        {
          name: 'file',
          description: 'the file to open',
        },
      ],
      options: [],
      handler: async (args) => {
        if (args._.length === 0) {
          return {
            output: 'xdg-open: Missing operand',
            error: true,
          }
        }

        const fileName = args._[0]

        switch (fileName.match(/\.(?<extension>\w+)$/)?.groups?.extension) {
          case FileExtension.Markdown:
            const pathStr = [...path, fileName]
              .join('/')
              .replace(new RegExp(`.${FileExtension.Markdown}$`), '')

            openWindow(<Browser url={pathStr} proc={getProc()} />)

            return { output: 'Opening Browser...' }
            break

          default:
            const fileContents = await getFileContents([...path, fileName])
            if (fileContents.error) {
              if (fileContents.data === FileError.NoSuchFileOrDirectory) {
                // do not exist
                return {
                  output: `xdg-open: ${fileName}: No such file or directory`,
                  error: true,
                }
              } else if (fileContents.data === FileError.NotAFile) {
                // not a file
                return {
                  output: `xdg-open: ${fileName}: Is a directory`,
                  error: true,
                }
              } else {
                return {
                  output: `xdg-open: Error`,
                  error: true,
                }
              }
            }

            openWindow(
              <TextViewer content={fileContents.data} proc={getProc()} />
            )
            return { output: 'Opening TextViewer...' }
            break
        }
      },
    },
  ]
  // sort commands by name
  commands.sort((a, b) => a.name.localeCompare(b.name))

  const aliases: { [key: string]: string } = {
    '..': 'cd ..',
    l: 'ls -lah',
    la: 'ls -lAh',
    ll: 'ls -lh',
    lsa: 'ls -lah',
    open: 'xdg-open',
  }

  const [commandHistory, setCommandHistory] = useState<CommandHistory[]>([])

  useEffect(() => {
    commands
      .find((c) => c.name === 'help')!
      .handler({ _: [] })
      .then((result) => {
        setCommandHistory([
          {
            input: 'help',
            result: result,
            path: path,
            timestamp: '2020-01-01T00:00:00.000Z',
          },
        ])
      })
  }, [])

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
      error: true,
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

  const handleWindowKeyPress = () => {
    commandInputRef.current?.focus()
  }

  const scrollToBottom = () => {
    commandsEndRef.current?.scrollIntoView({ behavior: 'auto' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [commandHistory])

  return (
    <Window
      title={
        'matthias@portfolio:~' + (path.length > 0 ? '/' + path.join('/') : '')
      }
      width="735px"
      height="480px"
      draggable
      style={{ fontFamily: 'Ubuntu Mono' }}
    >
      <div
        className="h-full w-full cursor-text overflow-auto bg-zinc-700 px-1 py-2"
        onKeyPress={handleWindowKeyPress}
        tabIndex={0}
      >
        {commandHistory
          .filter((command) => !command.isInvisible)
          .map((command, index, filteredCommandHistory) => (
            <div className="flex flex-col items-start" key={command.timestamp}>
              <div className="flex items-center gap-2">
                {index !== 0 &&
                filteredCommandHistory.at(index - 1)?.result.error ? (
                  <TiArrowRightThick color="red" />
                ) : (
                  <TiArrowRightThick color="green" />
                )}
                <span className="text-teal-500">
                  {getPathSymbol(command.path)}
                </span>
                <span>{command.input}</span>
              </div>
              <div className="flex w-full flex-col items-start justify-start text-left">
                {command.result.output}
              </div>
            </div>
          ))}
        <div className="flex items-center gap-2">
          {commandHistory.at(-1)?.result.error ? (
            <TiArrowRightThick color="red" />
          ) : (
            <TiArrowRightThick color="green" />
          )}
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
    </Window>
  )
}

export default Terminal
