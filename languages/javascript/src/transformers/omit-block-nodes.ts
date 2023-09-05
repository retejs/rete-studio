import { structures } from 'rete-structures'
import {
  ASTNodeBase, BaseNode,
  BIND_KEY, Context, getInputNode, getOutputNode, removeRedunantNodes, Schemes, ToASTContext
} from 'rete-studio-core'
import { Connection } from 'rete-studio-core'

import { Transformer } from './interface'

export class OmitBlockNodes<ASTNode extends ASTNodeBase, S extends Schemes> extends Transformer<Context<ASTNode, S>, ToASTContext<ASTNode, S>> {
  constructor() {
    super('Omit block nodes')
  }

  async up(context: Context<ASTNode, S>) {
    await (removeRedunantNodes<S, ASTNode>(node => [
      'File', 'Program', 'VariableDeclaration', 'BlockStatement',
      'Placeholder', 'EmptyStatement'
    ].includes(node.label)))(context)
  }

  private async insertNode<S extends Schemes>({ editor }: ToASTContext<ASTNode, S>, node: S['Node'], right: S['Node']) {
    const inputs = editor.getConnections().filter(c => c.target === right.id && c.targetInput === BIND_KEY)

    // if (inputs.length > 1) throw new Error('OmitBlockNodes: Multiple inputs')

    for (const input of inputs) {
      await editor.removeConnection(input.id)
      const c = new Connection(editor.getNode(input.source), input.sourceOutput, node, BIND_KEY)

      await editor.addConnection(c)
    }

    await editor.addConnection(new Connection(node, BIND_KEY, right, BIND_KEY))
  }

  async down(context: ToASTContext<ASTNode, S>): Promise<void> {
    // Program, BlockStatement, VariableDeclaration
    const { editor } = context

    const closures = [undefined, ...editor.getNodes().filter(n => n.label === 'Closure')]

    for (const closure of closures) {
      const roots = (closure
        ? structures(editor).descendants(n => n.id === closure.id)
        : structures(editor)
      ).filter(n => n.label !== 'Closure').roots().nodes()
        // TODO if expression in wrong closure
        .filter(n => n.type === 'statement')

      if (roots.length === 0) {
        // console.warn('Cannot find root for Closure', closure?.id, 'Probably it is empty')
        continue
        // throw new Error('No root')
      }
      if (roots.length > 1) throw new Error('OmitBlockNodes: Multiple roots')

      const root = roots[0]
      // if (root.label === 'LabeledStatement') continue
      const start = closure ? new BaseNode('BlockStatement') : new BaseNode('Program')

      if (closure) {
        start.type = 'statement'
        start.parent = closure.id
      }
      await editor.addNode(start)

      await this.insertNode(context, start, root)
    }
    const variableDeclarators = structures(editor).filter(n => n.label === 'VariableDeclarator').nodes()

    for (const node of variableDeclarators) {
      const variableDeclaration = new BaseNode('VariableDeclaration')

      variableDeclaration.type = 'statement'
      variableDeclaration.data.kind = node.data.kind
      variableDeclaration.parent = node.parent
      await editor.addNode(variableDeclaration)
      await this.insertNode(context, variableDeclaration, node)
    }

    // fix CatchClause's BlockStatement

    const catchClauses = editor.getNodes().filter(n => n.label === 'CatchClause')

    for (const catchClause of catchClauses) {
      const [blockStatement, blockStatementOutput] = getInputNode(context, catchClause.id, BIND_KEY)
      const [tryStatement, tryStatementOutput] = getInputNode(context, blockStatement.id, BIND_KEY)
      const [next, nextInput] = getOutputNode(context, catchClause.id, BIND_KEY, false)

      await editor.removeConnection(blockStatementOutput.id)
      await editor.removeConnection(tryStatementOutput.id)
      if (nextInput) await editor.removeConnection(nextInput.id)
      await editor.addConnection(new Connection(tryStatement, tryStatementOutput.sourceOutput, catchClause, BIND_KEY))
      await editor.addConnection(new Connection(catchClause, BIND_KEY, blockStatement, BIND_KEY))
      if (next) await editor.addConnection(new Connection(blockStatement, BIND_KEY, next, BIND_KEY))
    }
  }
}
