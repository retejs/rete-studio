import { ANTLRInputStream, CommonTokenStream } from 'antlr4ts'

import { DSLLexer } from '../generated/antlr4/DSLLexer'
import { DSLParser } from '../generated/antlr4/DSLParser'
import { generate } from './generator'
import * as AST from './types'
import { ASTBuilder } from './visitor'

// Parse DSL code into AST
export function parse(code: string): AST.Program {
  const inputStream = new ANTLRInputStream(code)
  const lexer = new DSLLexer(inputStream)
  const tokenStream = new CommonTokenStream(lexer)
  const parser = new DSLParser(tokenStream)

  const tree = parser.program()
  const builder = new ASTBuilder()

  return builder.visit(tree) as AST.Program
}

// Export generator
export { generate }

// Export types
export * from './types'
