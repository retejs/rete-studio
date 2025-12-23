import { ClassicPreset } from 'rete'
import {
  BaseNode,
  BaseOptions,
  CodePlugin,
  Connection,
  Output,
  Schemes,
  socket } from 'rete-studio-core'

import * as AST from './ast'
import { AddControls } from './transformers/add-controls'
import { InnerPorts } from './transformers/inner-ports'
import { TreeFlow } from './transformers/tree-flow'

const base: BaseOptions<Schemes> = {
  createInput(label) {
    return new ClassicPreset.Input(socket, label, true)
  },
  createOutput(label) {
    return new Output(socket, label, true)
  },
  createConnection(source, sourceOutput, target, targetInput, options) {
    return new Connection(source, sourceOutput, target, targetInput, options)
  },
  createNode(type) {
    return new BaseNode(type)
  }
}

export const astTools = {
  async parse(code: string) {
    return AST.parse(code)
  },
  async generate(ast: AST.Program) {
    return AST.generate(ast)
  },
  async purify(ast: AST.Program) {
    // No transformation needed for DSL
    return ast
  },
  async unpurify(ast: AST.Program) {
    // No transformation needed for DSL
    return ast
  }
}

export function initCodePlugin() {
  const processedTypes = new Set<string>()
  const unsupportedTypes: string[] = []

  const code = new CodePlugin<Schemes, AST.DSLNode>({
    transformers: [
      new TreeFlow(),
      new InnerPorts(),
      new AddControls()
    ],
    up: {
      ...base,
      isSupported(_data) {
        return true
      },
      isStatement(data) {
        return (
          data.type === 'VarDeclaration' ||
          data.type === 'IfStatement' ||
          data.type === 'ExpressionStatement' ||
          data.type === 'Block'
        )
      },
      isExpression(data) {
        return (
          data.type === 'BinaryExpression' ||
          data.type === 'ParenExpression' ||
          data.type === 'Identifier' ||
          data.type === 'NumberLiteral'
        )
      },
      nodeCreated(node) {
        node.type && processedTypes.add(node.type)
      }
    },
    down: {
      ...base,
      createASTNode(node, args) {
        // Create AST nodes based on node label
        const type = node.label
        const params = args[0] || {}

        switch (type) {
        case 'Program':
          return {
            type: 'Program',
            body: params.body || []
          } as AST.Program

        case 'VarDeclaration':
          return {
            type: 'VarDeclaration',
            id: params.id || { type: 'Identifier', name: 'x' },
            init: params.init || { type: 'NumberLiteral', value: 0 }
          } as AST.VarDeclaration

        case 'IfStatement':
          return {
            type: 'IfStatement',
            test: params.test || { type: 'NumberLiteral', value: 1 },
            consequent: params.consequent || { type: 'Block', body: [] },
            alternate: params.alternate
          } as AST.IfStatement

        case 'Block':
          return {
            type: 'Block',
            body: params.body || []
          } as AST.Block

        case 'ExpressionStatement':
          return {
            type: 'ExpressionStatement',
            expression: params.expression || { type: 'NumberLiteral', value: 0 }
          } as AST.ExpressionStatement

        case 'BinaryExpression':
          return {
            type: 'BinaryExpression',
            operator: params.operator || '+',
            left: params.left || { type: 'NumberLiteral', value: 0 },
            right: params.right || { type: 'NumberLiteral', value: 0 }
          } as AST.BinaryExpression

        case 'ParenExpression':
          return {
            type: 'ParenExpression',
            expression: params.expression || { type: 'NumberLiteral', value: 0 }
          } as AST.ParenExpression

        case 'Identifier':
          return {
            type: 'Identifier',
            name: params.name || 'x'
          } as AST.Identifier

        case 'NumberLiteral':
          return {
            type: 'NumberLiteral',
            value: params.value || 0
          } as AST.NumberLiteral

        default:
          return {} as any
        }
      },
      nodeParameters(label: string) {
        // Return parameter names for each node type
        switch (label) {
        case 'Program':
          return ['body']
        case 'VarDeclaration':
          return ['id', 'init']
        case 'IfStatement':
          return ['test', 'consequent', 'alternate']
        case 'Block':
          return ['body']
        case 'ExpressionStatement':
          return ['expression']
        case 'BinaryExpression':
          return ['left', 'operator', 'right']
        case 'ParenExpression':
          return ['expression']
        case 'Identifier':
          return ['name']
        case 'NumberLiteral':
          return ['value']
        default:
          return []
        }
      },
      defaults(_node) {
        // Set default values for node parameters
      }
    }
  })

  async function toGraph(ast: AST.Program) {
    await code.toGraph(ast)
  }

  async function toAST() {
    const ast = await code.toAST<AST.Program>()

    return astTools.unpurify(ast)
  }

  return {
    code,
    astTools,
    unsupportedTypes,
    processedTypes,
    toGraph,
    toAST
  }
}
