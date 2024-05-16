import {
  ASTNodeBase, BIND_KEY, Context, flowToTree,
  Schemes, ToASTContext, treeToFlow
} from 'rete-studio-core'

import { Transformer } from './interface'

export class TreeFlow<ASTNode extends ASTNodeBase, S extends Schemes> extends Transformer<Context<ASTNode, S>, ToASTContext<ASTNode, S>> {
  constructor() {
    super('tree flow')
  }

  async up(context: Context<ASTNode, S>) {
    await (treeToFlow<S, ASTNode>({
      isStart: node => ['Program', 'ClassMethod', 'FunctionExpression', 'ArrowFunctionExpression'].includes(node.label),
      isSequence: node => {
        if (['Program', 'BlockStatement'].includes(node.label)) return /^body\[.*\]$/
        if (['VariableDeclaration'].includes(node.label)) return /^declarations\[.*\]$/
        if (['CatchClause'].includes(node.label)) return /^body$/
        return false
      },
      getBlockParameterName(node) {
        if (node.label === 'Program') return { array: true, key: 'body' }
        if (node.label === 'VariableDeclaration') return { array: true, key: 'declarations' }
        if (node.label === 'CatchClause') return { array: false, key: 'body' }
        if (node.label === 'ObjectPattern') return { array: true, key: 'properties' }
        return { array: true, key: 'body' }
      },
      isBranch: node => {
        if (['IfStatement'].includes(node.label)) return /(alternate|consequent)/
        if (['TryStatement'].includes(node.label)) return /(block|handler|finalizer)/
        if (['LabeledStatement'].includes(node.label)) return /(body|alternate)/
        return false
      }
    }))(context)
  }

  async down(context: ToASTContext<ASTNode, S>): Promise<void> {
    await (flowToTree<S, ASTNode>({
      isRoot(node, context) {
        if (node.label === 'BlockStatement') {
          const prev = context.editor.getConnections()
            .filter(c => c.target === node.id && c.targetInput === BIND_KEY)
            .map(c => context.editor.getNode(c.source))

          if (prev.length === 0) throw new Error('BlockStatement must have an incomer')
          if (prev.length > 1) return false
          return ['ClassMethod', 'FunctionExpression', 'Constructor', 'ArrowFunctionExpression'].includes(prev[0].label)
        }
        return ['Program'].includes(node.label)
      },
      isBranch(node) {
        return ['IfStatement', 'TryStatement', 'LabeledStatement'].includes(node.label)
      },
      getBranchNames(node) {
        if (node.label === 'IfStatement') return ['consequent', 'alternate']
        if (node.label === 'LabeledStatement') return ['body', 'alternate']
        if (node.label === 'TryStatement') return ['block', 'handler', 'finalizer']
        throw new Error(`Unknown branch node ${node.label}`)
      },
      isBlock(node) {
        return ['BlockStatement', 'Program', 'VariableDeclaration', 'CatchClause'].includes(node.label)
      },
      getBlockParameterName(node) {
        if (node.label === 'Program') return { array: true, key: 'body' }
        if (node.label === 'VariableDeclaration') return { array: true, key: 'declarations' }
        if (node.label === 'CatchClause') return { array: false, key: 'body' }
        if (node.label === 'ObjectPattern') return { array: true, key: 'properties' }
        return { array: true, key: 'body' }
      },
      isValidSubflow(entry, flow) {
        if (entry.label === 'VariableDeclaration') return flow.label === 'VariableDeclarator'
        return true
      }
    }))(context)
  }
}
