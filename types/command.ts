import getopts from 'getopts'

type CommandResult = {
  output: JSX.Element | string
  error?: boolean
  shouldBeInvisible?: boolean
}

type CommandHistory = {
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

export { GetoptsType }
export type { CommandResult, CommandHistory, Option, Operand, Command }
