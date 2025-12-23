// @ts-nocheck
import {
  ASTNodeBase, BIND_KEY, Context, forEach, getInputNode, Schemes, ToASTContext
} from 'rete-studio-core'

import { Transformer } from './interface'

export class SolidBlocksEntry<ASTNode extends ASTNodeBase, S extends Schemes> extends Transformer<Context<ASTNode, S>, ToASTContext<ASTNode, S>> {
  constructor() {
    super('Solid blocks entry')
  }

  async up(context: Context<ASTNode, S>) {
    await (forEach<ASTNode, S>(n => ['FunctionExpression', 'ArrowFunctionExpression', 'ClassExpression', 'ClassMethod'].includes(n.label), async (node, context) => {
      const { editor, createConnection } = context
      const [input, inputCon] = getInputNode(context, node.id, BIND_KEY)

      await editor.removeConnection(inputCon.id)
      if (!node.parent) throw new Error('No parent for function expression')
      const closure = editor.getNode(node.parent)

      closure.label = node.label
      node.label = 'Entry'
      node.type = 'unknown'

      await editor.addConnection(createConnection(input, inputCon.sourceOutput, closure, BIND_KEY))
    }))(context)
  }

  async down(context: ToASTContext<ASTNode, S>): Promise<void> {
    context
  }
}
