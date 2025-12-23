// DSL AST Node Types

export type DSLNode =
  | Program
  | Statement
  | Expression
  | VarDeclaration
  | IfStatement
  | Block
  | ExpressionStatement
  | BinaryExpression
  | Identifier
  | NumberLiteral

export interface BaseNode {
  type: string
  loc?: Location
}

export interface Location {
  start: Position
  end: Position
}

export interface Position {
  line: number
  column: number
}

// Root node
export interface Program extends BaseNode {
  type: 'Program'
  body: Statement[]
}

// Statements
export type Statement = VarDeclaration | IfStatement | ExpressionStatement | Block

export interface VarDeclaration extends BaseNode {
  type: 'VarDeclaration'
  id: Identifier
  init: Expression
}

export interface IfStatement extends BaseNode {
  type: 'IfStatement'
  test: Expression
  consequent: Block
  alternate?: IfStatement | Block
}

export interface Block extends BaseNode {
  type: 'Block'
  body: Statement[]
}

export interface ExpressionStatement extends BaseNode {
  type: 'ExpressionStatement'
  expression: Expression
}

// Expressions
export type Expression =
  | BinaryExpression
  | Identifier
  | NumberLiteral
  | ParenExpression

export interface BinaryExpression extends BaseNode {
  type: 'BinaryExpression'
  operator: '+' | '-' | '*' | '/' | '>' | '<' | '>=' | '<=' | '==' | '!='
  left: Expression
  right: Expression
}

export interface ParenExpression extends BaseNode {
  type: 'ParenExpression'
  expression: Expression
}

export interface Identifier extends BaseNode {
  type: 'Identifier'
  name: string
}

export interface NumberLiteral extends BaseNode {
  type: 'NumberLiteral'
  value: number
}
