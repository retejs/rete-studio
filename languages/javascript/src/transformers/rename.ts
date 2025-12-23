// @ts-nocheck
import * as BabelType from '@babel/types'
import {
  ASTNodeBase, Context, getBinaryOperator, getLogicalOperator, getUnaryOperator, getUpdateOperator, humanizeOperator,
  rename, Schemes, ToASTContext } from 'rete-studio-core'

import { Transformer } from './interface'

export class Rename<ASTNode extends ASTNodeBase, S extends Schemes> extends Transformer<Context<ASTNode, S>, ToASTContext<ASTNode, S>> {
  constructor() {
    super('rename')
  }

  async up(context: Context<ASTNode, S>) {
    await (rename(node => {
      if (node.label === 'AssignmentExpression') return 'Assign'
      if (node.label === 'VariableDeclarator') return 'Variable'
      if (node.label === 'ImportDeclaration') return 'Import'
      if (node.label === 'ExportNamedDeclaration') return 'Export'
      if (node.label === 'ExportAllDeclaration') return 'Export all'
      if (node.label === 'ExportDefaultDeclaration') return 'Export default'
      if (node.label === 'ThrowStatement') return 'Throw'
      if (node.label === 'IfStatement') return 'If'
      if (node.label === 'DebuggerStatement') return 'Debug'
      if (node.label === 'ConditionalExpression') return 'If'
      if (node.label === 'CallExpression') return 'Call'
      if (node.label === 'ExpressionStatement') return 'Statement'
      if (node.label === 'SwitchStatement') return 'Switch'
      if (node.label === 'WithStatement') return 'With'
      if (node.label === 'ArrayExpression') return 'Array'
      if (node.label === 'ObjectExpression') return 'Object'
      if (node.label === 'NewExpression') return 'New'
      if (node.label === 'ObjectPattern') return 'Object destructing'
      if (node.label === 'ArrayPattern') return 'Array destructing'
      if (node.label === 'AssignmentPattern') return 'Default'
      if (node.label === 'SpreadElement') return 'Spread'
      if (node.label === 'RestElement') return 'Rest'
      if (node.label === 'YieldExpression') return 'Yield'
      if (node.label === 'ReturnStatement') return 'Return'
      if (node.label === 'TryStatement') return 'Try'
      if (node.label === 'CatchClause') return 'Catch'
      if (node.label === 'ThisExpression') return 'this'
      if (node.label === 'MemberExpression') return 'Member'
      if (node.label === 'OptionalMemberExpression') return 'Member (optional)'
      if (node.label === 'FunctionExpression') return 'Function'
      if (node.label === 'ArrowFunctionExpression') return 'Arrow function'
      if (node.label === 'ClassExpression') return 'Class'
      if (node.label === 'ExportSpecifier') return 'Export specifier'
      if (node.label === 'ImportSpecifier') return 'Import specifier'
      if (node.label === 'ClassProperty') return 'Class property'
      if (node.label === 'ObjectProperty') return 'Object property'
      if (node.label === 'AwaitExpression') return 'Await'
      if (node.label === 'RegExpLiteral') return 'Regular expression'
      if (node.label === 'UpdateExpression') return humanizeOperator(node.data.operator, 'update')
      if (node.label === 'BinaryExpression') return humanizeOperator(node.data.operator, 'binary')
      if (node.label === 'UnaryExpression') return humanizeOperator(node.data.operator, 'unary')
      if (node.label === 'LogicalExpression') return humanizeOperator(node.data.operator, 'logical')
    }, node => (node as any).updateSize()))(context)
  }

  async down(context: ToASTContext<ASTNode, S>): Promise<void> {
    await (rename(node => {
      if (node.label === 'Assign') {
        node.data.operator = '='
        return 'AssignmentExpression'
      }
      if (node.label === 'Variable') return 'VariableDeclarator'
      if (node.label === 'Import') return 'ImportDeclaration'
      if (node.label === 'Export') return 'ExportNamedDeclaration'
      if (node.label === 'Export all') return 'ExportAllDeclaration'
      if (node.label === 'Export default') return 'ExportDefaultDeclaration'
      if (node.label === 'Throw') return 'ThrowStatement'
      if (node.label === 'Debug') return 'DebuggerStatement'
      if (node.label === 'If') return node.type === 'expression' ? 'ConditionalExpression' : 'IfStatement'
      if (node.label === 'Call') return 'CallExpression'
      if (node.label === 'Statement') return 'ExpressionStatement'
      if (node.label === 'Switch') return 'SwitchStatement'
      if (node.label === 'With') return 'WithStatement'
      if (node.label === 'Array') return 'ArrayExpression'
      if (node.label === 'Object') return 'ObjectExpression'
      if (node.label === 'New') return 'NewExpression'
      if (node.label === 'Object destructing') return 'ObjectPattern'
      if (node.label === 'Array destructing') return 'ArrayPattern'
      if (node.label === 'Default') return 'AssignmentPattern'
      if (node.label === 'Spread') return 'SpreadElement'
      if (node.label === 'Rest') return 'RestElement'
      if (node.label === 'Yield') return 'YieldExpression'
      if (node.label === 'Return') return 'ReturnStatement'
      if (node.label === 'Try') return 'TryStatement'
      if (node.label === 'Catch') return 'CatchClause'
      if (node.label === 'this') return 'ThisExpression'
      if (node.label === 'Member') return 'MemberExpression'
      if (node.label === 'Member (optional)') return 'OptionalMemberExpression'
      if (node.label === 'Function') return 'FunctionExpression'
      if (node.label === 'Arrow function') return 'ArrowFunctionExpression'
      if (node.label === 'Class') return 'ClassExpression'
      if (node.label === 'Export specifier') return 'ExportSpecifier'
      if (node.label === 'Import specifier') return 'ImportSpecifier'
      if (node.label === 'Class property') return 'ClassProperty'
      if (node.label === 'Object property') return 'ObjectProperty'
      if (node.label === 'Await') return 'AwaitExpression'
      if (node.label === 'Regular expression') return 'RegExpLiteral'

      if (getUpdateOperator(node.label)) {
        node.data.operator = getUpdateOperator(node.label)
        return 'UpdateExpression'
      }

      const unaryOperator = getUnaryOperator(node.label)

      if (unaryOperator) {
        node.data.operator = unaryOperator
        return 'UnaryExpression'
      }
      const binaryOperator = getBinaryOperator(node.label) || BabelType.BINARY_OPERATORS.find(op => op === node.label)
      const logicalOperator = getLogicalOperator(node.label) || BabelType.LOGICAL_OPERATORS.find(op => op === node.label)

      if (binaryOperator) {
        node.data.operator = binaryOperator
        return 'BinaryExpression'
      }
      if (logicalOperator) {
        node.data.operator = logicalOperator
        return 'LogicalExpression'
      }
      // throw new Error(`Unknown node type: ${node.label}`)
    }, node => (node as any).updateSize()))(context)
  }
}
