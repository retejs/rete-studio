// @ts-nocheck
import { ClassicPreset } from 'rete'
import {
  ASTNodeBase, BIND_KEY, cleanUpPorts, Context,
  EnsurePort, ensurePorts,
  RefSocket, Schemes, ToASTContext } from 'rete-studio-core'

import { Transformer } from './interface'

export class CleanUpPorts<ASTNode extends ASTNodeBase, S extends Schemes> extends Transformer<Context<ASTNode, S>, ToASTContext<ASTNode, S>> {
  constructor() {
    super('Clean up ports')
  }

  async up(context: Context<ASTNode, S>) {
    const { editor } = context

    await (cleanUpPorts(node => {
      if (node.type === 'expression') return { inputs: [BIND_KEY], outputs: [BIND_KEY] }
      if (node.label === 'IfStatement') return { outputs: [BIND_KEY] }
      if (node.label === 'TryStatement') return { outputs: [BIND_KEY] }
      if (node.label === 'CatchClause') return { outputs: ['body'] }
      if (node.label === 'Closure') return { inputs: [BIND_KEY], outputs: [BIND_KEY] }
      if (node.label === 'Constructor') return { inputs: [BIND_KEY] }
      if (['FunctionExpression', 'ArrowFunctionExpression', 'ClassExpression'].includes(node.label)) return { inputs: [BIND_KEY] }
      if (node.label === 'Entry') {
        const outputs: string[] = []
        const parent = node.parent ? editor.getNode(node.parent) : null

        if (parent?.label === 'ClassExpression') {
          outputs.push('body')
        } else if (parent?.label === 'Constructor') {
          outputs.push('key')
        }

        return { inputs: [BIND_KEY], outputs: [BIND_KEY, ...outputs] }
      }
    }, (node, key, port) => {
      if ((port as any)?.control) {
        node.addControl(key, (port as any).control as ClassicPreset.Control)
      }
    }))(context)
    await (ensurePorts(node => {
      if (node.label === 'VariableDeclarator') {
        return { inputs: ['init'] }
      }
    }, () => null))(context)
  }
  async down(context: ToASTContext<ASTNode, S>): Promise<void> {
    const { editor } = context

    await (ensurePorts(node => {
      if (node.label === 'Entry') {
        const extra: EnsurePort[] = []
        const parent = node.parent ? editor.getNode(node.parent) : null

        if (parent?.label === 'ClassExpression') {
          extra.push('body')
        } else if (parent?.label === 'Constructor') {
          extra.push(['key', () => new RefSocket('Reference', 'constructor')])
        }

        return { inputs: [BIND_KEY], outputs: [BIND_KEY, ...extra] }
      }
      return { inputs: [BIND_KEY], outputs: [BIND_KEY] }
    }, () => null))(context)
  }
}
