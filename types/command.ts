import getopts from 'getopts'

const enum OptionType {
  String = 'string',
  Boolean = 'boolean',
}

const enum OperandType {
  File,
  Directory,
  Program,
  String,
  Other,
}

type CommandResult = {
  output: string
  error?: boolean
  invisibleResult?: boolean
  notSavedInHistory?: boolean
}

type ExecutedCommand = {
  input: string
  result: CommandResult
  path: string[]
  timestamp: string
  isInvisible?: boolean
}

type Option = {
  name: string
  description: string
  type: OptionType
}

type Operand = {
  name: string
  description: string
  type: OperandType
}

type Command = {
  name: string
  description: string
  operands: Operand[]
  options: Option[]
  handler: (args: getopts.ParsedOptions) => Promise<CommandResult>
}

export { OptionType, OperandType }
export type { CommandResult, ExecutedCommand, Option, Operand, Command }

