import {
  ChangeEvent,
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
  ExecutedCommand,
  CommandResult,
  GetoptsType,
} from '../../../types/command'
import Window from '../../Window'
import { WindowsContext } from '../../OperatingSystem'
import Browser from '../Browser'
import TextViewer from '../TextViewer'
import { TableElement } from '../../../types/table'
import Table from '../../Table'
import cn from 'classnames'
import s from './Terminal.module.css'

interface Props {
  className?: string
  style?: React.CSSProperties
  draggable?: boolean
}

const Terminal: FC<Props> = ({ className, style, draggable }) => {
  const commandsEndRef = useRef<null | HTMLDivElement>(null)
  const commandInputRef = useRef<null | HTMLInputElement>(null)

  const { windows, openWindow, getProcess } = useContext(WindowsContext)
  const [path, setPath] = useState<string[]>([])
  const files = useFiles(path)
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [filteredCommandHistory, setFilteredCommandHistory] = useState<
    string[]
  >([])
  const [filteredCommandHistoryIndex, setFilteredCommandHistoryIndex] =
    useState<number>(0)
  const [typedInput, setTypedInput] = useState<string>('')
  const [executedCommands, setExecutedCommands] = useState<ExecutedCommand[]>(
    []
  )
  const [hint, setHint] = useState<TableElement[]>([])

  const incrementFilteredCommandHistoryIndex = () => {
    if (filteredCommandHistoryIndex < filteredCommandHistory.length) {
      setFilteredCommandHistoryIndex(filteredCommandHistoryIndex + 1)
    }
  }

  const decrementFilteredCommandHistoryIndex = () => {
    if (filteredCommandHistoryIndex > 0) {
      setFilteredCommandHistoryIndex(filteredCommandHistoryIndex - 1)
    }
  }

  const addCommandToExecutedList = (command: ExecutedCommand) => {
    setExecutedCommands([...executedCommands, command])
  }

  const addCommandToHistory = (command: string) => {
    setCommandHistory([...commandHistory, command])
  }

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
        // make all executedCommands items invisible
        let tmp = executedCommands
        tmp.forEach((item) => (item.isInvisible = true))
        setExecutedCommands(tmp)
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
          const data: TableElement[] = filteredFiles.map((file) => ({
            name: file.name,
            className: file.type === FileType.Directory ? 'text-sky-600' : '',
          }))

          output = <Table data={data} />
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

            openWindow(
              <Browser
                className={cn(s.window)}
                url={pathStr}
                process={getProcess()}
              />
            )

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
              <TextViewer
                className={cn(s.window)}
                content={fileContents.data}
                process={getProcess()}
              />
            )
            return { output: 'Opening TextViewer...' }
            break
        }
      },
    },
    {
      name: 'apt',
      description: 'command-line interface',
      operands: [
        {
          name: 'action',
          description: 'possible actions: install',
        },
        {
          name: 'command',
          description: 'command to install',
        },
      ],
      options: [],
      handler: async (args) => {
        if (args._.length === 0) {
          return { output: 'apt: no action selected' }
        }

        const action = args._[0]
        if (action === 'install') {
          const commands = args._.slice(1)

          const res = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/contact/`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ message: commands.join(' ') }),
            }
          )
          const data = await res.json()

          if (res.status != 200) {
            return {
              output: `apt: ${data.data}`,
              error: true,
            }
          }

          return {
            output: `installation of the following commands was requested from the author: ${commands.join(
              ' '
            )}`,
          }
        } else {
          return { output: `apt: invalid operand ${action}` }
        }
      },
    },
    {
      name: 'man',
      description: 'an interface to the system reference manuals',
      operands: [
        {
          name: 'page',
          description: 'name of the program, utility of function',
        },
      ],
      options: [],
      handler: async (args) => {
        if (args._.length === 0) {
          return {
            output: (
              <>
                <span>What manual page do you want?</span>
                <span>For example, try 'man man'.</span>
              </>
            ),
            error: true,
          }
        }
        const page = args._[0]

        const commandObj = getCommandFromString(page)

        // FIXME: find alternative to &nbsp;
        if (commandObj) {
          return {
            output: (
              <>
                <span>NAME</span>
                <span>
                  &nbsp;&nbsp;&nbsp;&nbsp;{commandObj.name} -{' '}
                  {commandObj.description}
                </span>
                <span>SYNOPSIS</span>
                <span>
                  &nbsp;&nbsp;&nbsp;&nbsp;{commandObj.name}{' '}
                  {commandObj.options.length > 0 && '[OPTION]...'}{' '}
                  {commandObj.operands
                    .map((operand) => `[${operand.name}]`)
                    .join(' ')}
                </span>
                {commandObj.options.length > 0 && <span>OPTIONS</span>}
                {commandObj.options.map((option) => (
                  <span>
                    &nbsp;&nbsp;&nbsp;&nbsp;-{option.name}&nbsp;&nbsp;
                    {option.description}
                  </span>
                ))}
              </>
            ),
          }
        }
        return { output: `No manual entry for ${page}` }
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
    'apt-get': 'apt',
  }

  const getCommandFromString = (command: string): Command | undefined => {
    const commandObj = commands.find((c) => c.name === command)
    return commandObj
  }

  const getCommandResult = async (input: string): Promise<CommandResult> => {
    let command: ParseEntry, args: ParseEntry[]

    while (true) {
      ;[command, ...args] = cmdParse(input) // FIXME: formatter adds semicolon
      if (command == undefined) return { output: '', notSavedInHistory: true }

      if (aliases[command.toString()])
        input = input.replace(command.toString(), aliases[command.toString()])
      else break
    }

    const commandObj = getCommandFromString(command.toString())
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

  const exec = (input: string): void => {
    getCommandResult(input).then((result) => {
      addCommandToExecutedList({
        input: input,
        result: result,
        path: path,
        timestamp: new Date().toISOString(),
        isInvisible: result.shouldBeInvisible,
      })
      if (!result.notSavedInHistory) {
        addCommandToHistory(input)
      }
    })
  }

  const scrollToBottom = () => {
    commandsEndRef.current?.scrollIntoView({ behavior: 'auto' })
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      const input = event.currentTarget.value
      exec(input)
      event.currentTarget.value = ''
      setTypedInput('')
      setHint([])
    } else if (event.key === 'ArrowUp') {
      decrementFilteredCommandHistoryIndex()
    } else if (event.key === 'ArrowDown') {
      incrementFilteredCommandHistoryIndex()
    } else if (event.key === 'Tab') {
      event.preventDefault()
      const input = event.currentTarget.value

      let filteredList: TableElement[]

      const words = input.split(' ')
      const lastWord = words[words.length - 1]
      if (words.length === 1) {
        // Is a command
        const list1 = commands.map((c) => ({
          name: c.name,
        }))

        const list2 = Object.keys(aliases).map((a) => ({
          name: a,
        }))

        filteredList = [...list1, ...list2].filter((el) =>
          el.name.toLowerCase().startsWith(lastWord.toLowerCase())
        )
      } else {
        // Is a file list
        filteredList = files
          .filter((file) => {
            let lastWordLowerCase = lastWord.toLowerCase()
            if (lastWordLowerCase === '') {
              // Don't include hidden files if not explicitly asked for
              return !file.name.toLowerCase().startsWith('.')
            }

            return file.name.toLowerCase().startsWith(lastWordLowerCase)
          })
          .map((file) => ({
            name: file.name,
            className: file.type === FileType.Directory ? 'text-sky-600' : '',
          }))
      }

      if (filteredList.length === 0) {
        setHint([])
        return
      }

      let str = words.length > 1 ? words.slice(0, -1).join(' ') + ' ' : ''
      if (filteredList.length === 1) {
        setHint([])
        str += filteredList[0].name + ' '
      } else {
        filteredList.sort((a, b) => a.name.localeCompare(b.name))
        const indexStr1 = 0,
          indexStr2 = filteredList.length - 1
        const max = Math.min(
          filteredList[indexStr1].name.length,
          filteredList[indexStr2].name.length
        )
        for (let i = 0; i < max; i++) {
          if (
            filteredList[indexStr1].name[i] !== filteredList[indexStr2].name[i]
          ) {
            break
          }

          str += filteredList[indexStr1].name[i]
        }
        setHint(filteredList)
      }

      event.currentTarget.value = str
      setTypedInput(str)
    }
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTypedInput(event.target.value)
  }

  const handleWindowKeyPress = () => {
    commandInputRef.current?.focus()
  }

  useEffect(() => {
    // exec('help')
  }, [])

  useEffect(() => {
    if (typedInput.length > 0) {
      setFilteredCommandHistory(
        commandHistory.filter((c) => c.startsWith(typedInput))
      )
    } else {
      setFilteredCommandHistory(commandHistory)
    }
  }, [typedInput])

  useEffect(() => {
    scrollToBottom()
  }, [executedCommands, hint])

  useEffect(() => {
    setFilteredCommandHistory(commandHistory)
  }, [commandHistory])

  useEffect(() => {
    setFilteredCommandHistoryIndex(filteredCommandHistory.length)
  }, [filteredCommandHistory])

  useEffect(() => {
    if (commandInputRef.current) {
      if (
        filteredCommandHistoryIndex >= 0 &&
        filteredCommandHistoryIndex < filteredCommandHistory.length
      ) {
        commandInputRef.current.value =
          filteredCommandHistory[filteredCommandHistoryIndex]
      } else {
        commandInputRef.current.value = typedInput
      }
    }
  }, [filteredCommandHistoryIndex])

  return (
    <Window
      title={
        'matthias@portfolio:~' + (path.length > 0 ? '/' + path.join('/') : '')
      }
      draggable={draggable}
      style={{ fontFamily: 'Ubuntu Mono', ...style }}
      className={cn(s.window, className)}
    >
      <div
        className="h-full w-full cursor-text overflow-auto bg-zinc-700 px-1 py-2"
        onKeyPress={handleWindowKeyPress}
        tabIndex={0}
      >
        {executedCommands
          .filter((command) => !command.isInvisible)
          .map((command, index, filteredExecutedCommands) => (
            <div className="flex flex-col items-start" key={command.timestamp}>
              <div className="flex items-center gap-2">
                {index !== 0 &&
                filteredExecutedCommands.at(index - 1)?.result.error ? (
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
          {executedCommands.at(-1)?.result.error ? (
            <TiArrowRightThick color="red" />
          ) : (
            <TiArrowRightThick color="green" />
          )}
          <span className="text-teal-500">{getPathSymbol(path)}</span>
          <div className="relative grow">
            <input
              className="w-full border-0 bg-transparent outline-0"
              onKeyDown={handleKeyDown}
              onChange={handleChange}
              ref={commandInputRef}
            ></input>
            {/* <i className="caret"></i> */}
          </div>
        </div>
        <div className="flex w-full flex-col items-start justify-start text-left">
          <Table data={hint} />
        </div>
        <div ref={commandsEndRef} />
      </div>
    </Window>
  )
}

export default Terminal
