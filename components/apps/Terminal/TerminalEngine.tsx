import { App } from '@customtypes/apps'
import {
  CommandResult,
  Operand,
  OperandType,
  Option,
  OptionType,
} from '@customtypes/command'
import { FileError, FileExtension, Node, NodeType } from '@customtypes/file'
import { getFileContents, getFiles } from '@lib/files'
import { mod } from '@lib/math'
import { getPathSymbol } from '@lib/path'
import c from 'ansi-colors'
import ansiEscapes from 'ansi-escapes'
import getopts from 'getopts'
import { FC, useEffect, useRef, useState } from 'react'
import { ParseEntry, parse as cmdParse } from 'shell-quote'
import { ITerminalOptions } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'
import XTerm from './XTerm'

// Custom theme to match style of xterm.js logo
const baseTheme = {
  foreground: '#F8F8F8',
  background: '#3f3f46',
  selection: '#5DA5D533',
  black: '#1E1E1D',
  brightBlack: '#262625',
  red: '#CE5C5C',
  brightRed: '#FF7272',
  green: '#5BCC5B',
  brightGreen: '#72FF72',
  yellow: '#CCCC5B',
  brightYellow: '#FFFF72',
  blue: '#5D5DD3',
  brightBlue: '#7279FF',
  magenta: '#BC5ED1',
  brightMagenta: '#E572FF',
  cyan: '#5DA5D5',
  brightCyan: '#72F0FF',
  white: '#F8F8F8',
  brightWhite: '#FFFFFF',
}

const options: ITerminalOptions = {
  allowProposedApi: true, // Needed for WebLinksAddon
  fontSize: 16,
  lineHeight: 1.2,
  rendererType: 'canvas',
  // // mobile: can select single word via long press
  rightClickSelectsWord: true,
  convertEol: true,
  fontFamily: 'Ubuntu Mono',
  theme: baseTheme,
  cursorBlink: true,
}

type Commands = {
  [name: string]: {
    description: string
    operands: Operand[]
    options: Option[]
    handler: (args: getopts.ParsedOptions) => Promise<CommandResult>
  }
}

export interface TerminalEngineProps {
  openWindow: (app: App, data: any) => void
  onPathChange?: (newPath: string[]) => void
}

// FIXME: Move this variables to a better place
let path: string[] = []
let files: Node[] = []
// END FIXME

export const TerminalEngine: FC<TerminalEngineProps> = ({
  openWindow,
  onPathChange,
}) => {
  const xtermRef = useRef<null | XTerm>(null)
  const fitAddon = new FitAddon()

  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [filteredCommandHistory, setFilteredCommandHistory] = useState<
    string[]
  >([])
  const [filteredCommandHistoryIndex, setFilteredCommandHistoryIndex] =
    useState<number>(0)
  const [typedInput, setTypedInput] = useState<string>('')
  const [input, setInput] = useState<string>('')
  const [cursorDelta, setCursorDelta] = useState<number>(0)

  /**
   * Append a string to the typed input at the specified cursor position
   * @param input The original input
   * @param text A string to be added
   * @param cursorPosition The position of the cursor in the typed input
   */
  const appendToTypedInput = (text: string, position: number) => {
    setTypedInput(
      input.substring(0, position) + text + input.substring(position)
    )
  }

  /**
   * Remove a character from the typed input at the specified cursor position
   * @param input The original input
   * @param cursorPosition The position of the cursor in the typed input
   */
  const removeFromTypedInput = (position: number) => {
    const subStrBeforeChar = input.substring(0, position)
    const subStrAfterChar = input.substring(position + 1)
    if (xtermRef.current) {
      xtermRef.current.terminal.write(ansiEscapes.cursorSavePosition)
      xtermRef.current.terminal.write(subStrAfterChar + ' ')
      xtermRef.current.terminal.write(ansiEscapes.cursorRestorePosition)
    }
    setTypedInput(subStrBeforeChar + subStrAfterChar)
  }

  const addCommandToHistory = (command: string) => {
    setCommandHistory([...commandHistory, command])
  }

  const setPath = (newPath: string[]) => {
    path = newPath

    getFiles(newPath).then((files) => {
      if (!files.error) setFiles(files.data)
    })

    if (onPathChange) onPathChange(newPath)
  }

  const setFiles = (newFiles: Node[]) => {
    files = newFiles
  }

  const commands: Commands = {
    alias: {
      description: 'show aliases',
      operands: [],
      options: [],
      handler: async (args) => {
        const output = [
          ...Object.keys(aliases).map(
            (alias) => `  ${alias.padEnd(10)} ${aliases[alias]}`
          ),
        ].join('\n\r')
        return { output: output }
      },
    },
    cd: {
      description: 'change the working directory',
      operands: [
        {
          name: 'directory',
          description: 'the directory to change to',
          type: OperandType.Directory,
        },
      ],
      options: [],
      handler: async (args) => {
        // Change directory to args._[0]
        const inputPath = args._[0]
        if (inputPath === undefined) {
          setPath([])
        } else if (inputPath === '..') {
          if (path.length > 0) {
            const newPath = path.slice(0, -1)
            setPath(newPath)
          }
        } else if (inputPath === '.') {
          // Do nothing
        } else {
          const newPath = [...path, ...inputPath.split('/')]
          const filesInPath = await getFiles(newPath)
          if (filesInPath.error) {
            if (filesInPath.data === FileError.NoSuchFileOrDirectory) {
              // Do not exist
              return {
                output: `cd: no such file or directory: ${inputPath}`,
                error: true,
              }
            } else if (filesInPath.data === FileError.NotADirectory) {
              // Not a directory
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

        return { output: '', invisibleResult: true }
      },
    },
    clear: {
      description: 'clear the terminal screen',
      operands: [],
      options: [],
      handler: async (args) => {
        if (xtermRef.current) {
          xtermRef.current.terminal.reset()
        }
        return { output: '', invisibleResult: true }
      },
    },
    code: {
      description: 'Open vs code',
      operands: [],
      options: [],
      handler: async (args) => {
        window.open(
          `https://github.dev/${process.env.NEXT_PUBLIC_GITHUB}`,
          '_blank'
        )

        return { output: '' }
      },
    },
    echo: {
      description: 'display a line of text',
      operands: [
        {
          name: 'text',
          description: 'the text to display',
          type: OperandType.String,
        },
      ],
      options: [],
      handler: async (args) => {
        return { output: args._.join(' ') }
      },
    },
    help: {
      description: 'print help',
      operands: [],
      options: [],
      handler: async (args) => {
        // Sort commands by key
        const output = Object.keys(commands)
          .sort()
          .map((command) => {
            const commandObj = commands[command]
            return `  ${command.padEnd(10)} ${commandObj.description}`
          })
          .join('\n\r')
        return { output: output }
      },
    },
    ls: {
      description: 'list directory contents',
      operands: [],
      options: [
        {
          name: 'l',
          description: 'use a long listing format',
          type: OptionType.Boolean,
        },
        {
          name: 'a',
          description: 'do not ignore entries starting with .',
          type: OptionType.Boolean,
        },
        {
          name: 'A',
          description: 'do not list implied . and ..',
          type: OptionType.Boolean,
        },
      ],
      handler: async (args) => {
        let filteredFiles = files

        if (args.A) {
          // Remove . and ..
          filteredFiles = filteredFiles.filter(
            (file) => !['.', '..'].includes(file.name)
          )
        } else if (!args.a) {
          // Remove hidden files
          filteredFiles = filteredFiles.filter(
            (file) => !file.name.startsWith('.')
          )
        }

        let output
        if (args.l) {
          output = filteredFiles
            .map((file) => {
              const { name, type } = file
              return `-rwxr--r-- ${process.env.NEXT_PUBLIC_AUTHOR_USERNAME} ${
                process.env.NEXT_PUBLIC_AUTHOR_USERNAME
              } ${type === NodeType.Directory ? c.cyan(name) : name}`
            })
            .join('\n\r')
        } else {
          output = filteredFiles
            .map((file) => {
              const { name, type } = file
              return type === NodeType.Directory ? c.cyan(name) : name
            })
            .join(' ')
        }

        return { output: output }
      },
    },
    cat: {
      description: 'concatenate files and print on the standard output',
      operands: [
        {
          name: 'file(s)',
          description: 'Concatenate FILE(s) to standard output.',
          type: OperandType.File,
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
              // Do not exist
              return {
                output: `cat: ${file}: No such file or directory`,
                error: true,
              }
            } else if (fileContents.data === FileError.NotAFile) {
              // Not a file
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

        return {
          output: output,
        }
      },
    },
    'xdg-open': {
      description: "opens a file in the user's preferred application",
      operands: [
        {
          name: 'file',
          description: 'the file to open',
          type: OperandType.File,
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

            openWindow(App.Browser, { url: pathStr })
            return { output: 'Opening Browser...' }
            break

          default:
            const fileContents = await getFileContents([...path, fileName])
            if (fileContents.error) {
              if (fileContents.data === FileError.NoSuchFileOrDirectory) {
                // Do not exist
                return {
                  output: `xdg-open: ${fileName}: No such file or directory`,
                  error: true,
                }
              } else if (fileContents.data === FileError.NotAFile) {
                // Not a file
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

            openWindow(App.TextViewer, { content: fileContents.data })
            return { output: 'Opening TextViewer...' }
            break
        }
      },
    },
    apt: {
      description: 'command-line interface',
      operands: [
        {
          name: 'action',
          description: 'possible actions: install',
          type: OperandType.Other,
        },
        {
          name: 'command',
          description: 'command to install',
          type: OperandType.Other,
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
    man: {
      description: 'an interface to the system reference manuals',
      operands: [
        {
          name: 'page',
          description: 'name of the program, utility of function',
          type: OperandType.Program,
        },
      ],
      options: [],
      handler: async (args) => {
        if (args._.length === 0) {
          return {
            output: [
              'What manual page do you want?',
              "For example, try 'man man'.",
            ].join('\n\r'),
            error: true,
          }
        }
        const command = args._[0]

        if (command in commands) {
          const commandObj = commands[command]
          if (commandObj) {
            return {
              output: [
                'NAME',
                `  ${command} - ${commandObj.description}`,
                'SYNOPSIS',
                `  ${command}` +
                  (commandObj.options.length > 0 ? ' [OPTION]...' : '') +
                  ' ' +
                  commandObj.operands
                    .map((operand) => `[${operand.name}]`)
                    .join(' '),
                commandObj.options.length > 0 ? 'OPTIONS' : '',
                ...commandObj.options.map(
                  (option) => `  -${option.name}  ${option.description}`
                ),
              ].join('\n\r'),
            }
          }
        }
        return { output: `No manual entry for ${command}` }
      },
    },
  }

  const aliases: { [key: string]: string } = {
    '..': 'cd ..',
    l: 'ls -lah',
    la: 'ls -lAh',
    ll: 'ls -lh',
    lsa: 'ls -lah',
    open: 'xdg-open',
    'apt-get': 'apt',
  }

  const getCommandResult = async (input: string): Promise<CommandResult> => {
    let command: ParseEntry, args: ParseEntry[]

    while (true) {
      ;[command, ...args] = cmdParse(input) // FIXME: formatter adds semicolon
      if (command == undefined)
        return {
          output: '',
          notSavedInHistory: true,
          invisibleResult: true,
        }

      if (command.toString() in aliases)
        input = input.replace(command.toString(), aliases[command.toString()])
      else break
    }

    if (command.toString() in commands) {
      const commandObj = commands[command.toString()]
      if (commandObj) {
        const rules: getopts.Options = commandObj.options.reduce(
          (prev, curr) => {
            if (curr.type in prev) prev[curr.type].push(curr.name)
            else prev[curr.type] = [curr.name]
            return prev
          },
          {} as { [key in OptionType]: string[] }
        )

        const paramObj = getopts(
          args.map((entry: ParseEntry) => entry.toString()),
          rules
        )

        return commandObj.handler(paramObj)
      }
    }
    return {
      output: `command not found: ${command.toString()}`,
      error: true,
    }
  }

  const exec = (input: string): void => {
    getCommandResult(input).then((result) => {
      if (xtermRef.current) {
        if (!result.invisibleResult) {
          xtermRef.current.terminal.writeln(`${result.output}`)
        }
      }
      if (!result.notSavedInHistory) {
        addCommandToHistory(input)
      }
      prompt(result.error)
    })
  }

  const prompt = (lastCommandError: boolean = false): void => {
    if (xtermRef.current) {
      xtermRef.current.terminal.write(
        `${lastCommandError ? c.red('➜') : c.green('➜')}  ${c.cyan(
          getPathSymbol(path)
        )} `
      )
    }
  }

  /**
   * Move cursor
   * @param delta positive for forward, negative for backward
   */
  const moveCursor = (delta: number = 1, save: boolean = true): void => {
    if (xtermRef.current) {
      if (delta === 0) return

      const newX = mod(
        xtermRef.current.terminal.buffer.active.cursorX + delta,
        xtermRef.current.terminal.cols
      )
      const newY =
        xtermRef.current.terminal.buffer.active.cursorY +
        Math.floor(
          (xtermRef.current.terminal.buffer.active.cursorX + delta) /
            xtermRef.current.terminal.cols
        )
      xtermRef.current.terminal.write(ansiEscapes.cursorTo(newX, newY))

      if (save) setCursorDelta((prev) => prev - delta)
    }
  }

  const onData = (data: string): void => {
    if (xtermRef.current) {
      if (
        (data >= String.fromCharCode(0x20) &&
          data <= String.fromCharCode(0x7e)) ||
        data >= '\u00a0' ||
        data === '\t'
      ) {
        // Insert the character at the cursor position
        xtermRef.current.terminal.write(ansiEscapes.cursorSavePosition)
        xtermRef.current.terminal.write(data)
        xtermRef.current.terminal.write(
          input.substring(input.length - cursorDelta)
        )
        xtermRef.current.terminal.write(ansiEscapes.cursorRestorePosition)
        moveCursor(data.length, false) // Hacky way to move the cursor properly
        appendToTypedInput(data, input.length - cursorDelta)
      }
    }
  }

  const customKeyEventHandler = (domEvent: KeyboardEvent): boolean => {
    if (xtermRef.current) {
      if (
        domEvent.type === 'keydown' &&
        domEvent.ctrlKey &&
        domEvent.shiftKey &&
        domEvent.code === 'KeyC'
      ) {
        const selection = xtermRef.current.terminal.getSelection()
        if (selection) navigator.clipboard.writeText(selection)
        return false
      } else if (
        domEvent.type === 'keydown' &&
        domEvent.ctrlKey &&
        domEvent.shiftKey &&
        domEvent.code === 'KeyV'
      ) {
        // Paste is handled by the xterm.js
        return true
      } else if (
        domEvent.type === 'keydown' &&
        domEvent.ctrlKey &&
        domEvent.code === 'KeyC'
      ) {
        moveCursor(cursorDelta)
        xtermRef.current.terminal.write(ansiEscapes.eraseDown)
        xtermRef.current.terminal.writeln('')
        setTypedInput('')
        prompt()
        return false
      } else if (
        domEvent.type === 'keydown' &&
        domEvent.ctrlKey &&
        domEvent.code === 'KeyL'
      ) {
        domEvent.preventDefault()
        exec('clear')
        return false
      } else if (domEvent.type === 'keydown' && domEvent.code === 'Enter') {
        moveCursor(cursorDelta)
        xtermRef.current.terminal.write(ansiEscapes.eraseDown)
        xtermRef.current.terminal.write('\n\r')
        exec(input)
        setTypedInput('')
        setInput('') // Force input to be empty (useEffect might run if typedInput is already empty)
        return false
      } else if (domEvent.type === 'keydown' && domEvent.code === 'Backspace') {
        if (cursorDelta >= input.length) return false

        moveCursor(-1, false)
        removeFromTypedInput(input.length - cursorDelta - 1)
        return false
      } else if (domEvent.type === 'keydown' && domEvent.code === 'Delete') {
        if (cursorDelta <= 0) return false

        removeFromTypedInput(input.length - cursorDelta)
        setCursorDelta((prev) => prev - 1)
        return false
      } else if (domEvent.type === 'keydown' && domEvent.code === 'Tab') {
        domEvent.preventDefault()

        let filteredList: string[] = []
        const partialInput = input
          .substring(0, input.length - cursorDelta)
          .trimStart()
        const words = partialInput.split(' ')
        const lastWord = words[words.length - 1].toLowerCase()
        if (partialInput.length === 0) {
          // Pass the character to onData function
          return true
        }
        if (words.length === 1) {
          // Command or alias
          filteredList = [
            ...Object.keys(commands),
            ...Object.keys(aliases),
          ].filter((name) =>
            name.toLowerCase().startsWith(lastWord.toLowerCase())
          )
        } else {
          // Command operand
          switch (commands[words[0]]?.operands.at(words.length - 2)?.type) {
            case OperandType.Directory:
              filteredList = files
                .filter((node) => {
                  if (node.type !== NodeType.Directory) return false

                  if (lastWord === '') {
                    // Don't include hidden files if not explicitly asked for
                    return !node.name.toLowerCase().startsWith('.')
                  }

                  return node.name.toLowerCase().startsWith(lastWord)
                })
                .map((directory) => c.cyan(directory.name))
              break
            case OperandType.Program:
              filteredList = Object.keys(commands).filter((command) =>
                command.toLowerCase().startsWith(lastWord)
              )
              break
            default:
              filteredList = files
                .filter((file) => {
                  if (lastWord === '') {
                    // Don't include hidden files if not explicitly asked for
                    return !file.name.toLowerCase().startsWith('.')
                  }

                  return file.name.toLowerCase().startsWith(lastWord)
                })
                .map((file) =>
                  file.type === NodeType.Directory
                    ? c.cyan(file.name)
                    : file.name
                )
              break
          }
        }

        if (filteredList.length === 0) return false

        let autocompletedStr =
          words.length > 1 ? words.slice(0, -1).join(' ') + ' ' : ''
        if (filteredList.length === 1) {
          autocompletedStr += filteredList[0] + ' '
        } else {
          filteredList.sort((a, b) => a.localeCompare(b))
          const indexStr1 = 0
          const indexStr2 = filteredList.length - 1
          const max = Math.min(
            filteredList[indexStr1].length,
            filteredList[indexStr2].length
          )
          for (let i = 0; i < max; i++) {
            if (filteredList[indexStr1][i] !== filteredList[indexStr2][i]) break

            autocompletedStr += filteredList[indexStr1][i]
          }
        }

        if (partialInput.length < c.unstyle(autocompletedStr).length) {
          // Auto-complete the common part
          moveCursor(-(input.length - cursorDelta))
          xtermRef.current.terminal.write(ansiEscapes.eraseDown)
          xtermRef.current.terminal.write(c.unstyle(autocompletedStr))
          setTypedInput(c.unstyle(autocompletedStr))
          setCursorDelta(0)
        } else {
          // Show hints
          xtermRef.current.terminal.write(ansiEscapes.cursorSavePosition)
          xtermRef.current.terminal.write('\n\r')
          xtermRef.current.terminal.write(filteredList.join('  '))
          xtermRef.current.terminal.write(ansiEscapes.cursorRestorePosition)
        }

        return false
      } else if (
        domEvent.type === 'keydown' &&
        (domEvent.code === 'ArrowUp' || domEvent.code === 'ArrowDown')
      ) {
        let newIndex, command

        if (domEvent.code === 'ArrowUp' && filteredCommandHistoryIndex > 0) {
          newIndex = filteredCommandHistoryIndex - 1
        } else if (
          domEvent.code === 'ArrowDown' &&
          filteredCommandHistoryIndex < filteredCommandHistory.length
        ) {
          newIndex = filteredCommandHistoryIndex + 1
        } else {
          return false
        }

        if (
          domEvent.code === 'ArrowDown' &&
          filteredCommandHistoryIndex === filteredCommandHistory.length - 1
        ) {
          command = typedInput
        } else {
          command = filteredCommandHistory[newIndex]
        }

        moveCursor(-(input.length - cursorDelta))
        xtermRef.current.terminal.write(ansiEscapes.eraseDown)
        xtermRef.current.terminal.write(command)
        setInput(command)
        setFilteredCommandHistoryIndex(newIndex)
        setCursorDelta(0)
        return false
      } else if (domEvent.type === 'keydown' && domEvent.code === 'ArrowLeft') {
        if (cursorDelta < input.length) moveCursor(-1)
        return false
      } else if (
        domEvent.type === 'keydown' &&
        domEvent.code === 'ArrowRight'
      ) {
        if (cursorDelta > 0) moveCursor(1)
        return false
      } else if (domEvent.type === 'keydown' && domEvent.code === 'Home') {
        moveCursor(-(input.length - cursorDelta))
        return false
      } else if (domEvent.type === 'keydown' && domEvent.code === 'End') {
        moveCursor(cursorDelta)
        return false
      }
    }

    return true
  }

  useEffect(() => {
    setInput(typedInput)
    if (typedInput.length > 0) {
      setFilteredCommandHistory(
        commandHistory.filter((c) => c.startsWith(typedInput))
      )
    } else {
      setFilteredCommandHistory(commandHistory)
    }
  }, [typedInput])

  useEffect(() => {
    setFilteredCommandHistory(commandHistory)
  }, [commandHistory])

  useEffect(() => {
    setFilteredCommandHistoryIndex(filteredCommandHistory.length)
  }, [filteredCommandHistory])

  useEffect(() => {
    fitAddon.fit()

    setPath([])
    if (xtermRef.current) {
      const command = 'help'
      prompt()
      xtermRef.current.terminal.writeln(command)
      exec(command)
    }
  }, [])

  return (
    <XTerm
      className="h-full w-full"
      ref={xtermRef}
      options={options}
      addons={[fitAddon]}
      onData={(event) => onData(event)}
      customKeyEventHandler={(event) => customKeyEventHandler(event)}
    />
  )
}
