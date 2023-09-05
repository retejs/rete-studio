import { structures } from 'rete-structures'
import { ASTNodeBase, BIND_KEY, Context, getInputNode, Schemes, ToASTContext } from 'rete-studio-core'
import { Connection } from 'rete-studio-core'

import { Transformer } from './interface'

export class ReverseUnpackSolidClosures<ASTNode extends ASTNodeBase, S extends Schemes> extends Transformer<Context<ASTNode, S>, ToASTContext<ASTNode, S>> {
  constructor() {
    super('Reverse unpack solid closures')
  }

  async up(context: Context<ASTNode, S>) {
    context
  }

  async down(context: ToASTContext<ASTNode, S>): Promise<void> {
    // unpack solid closures
    await (async (context) => {
      const { editor } = context

      const nodes = editor.getNodes().filter(node => ['FunctionExpression', 'ClassMethod', 'ArrowFunctionExpression', 'ClassExpression'].includes(node.label))

      for (const node of nodes) {
        const entry = editor.getNodes().find(n => n.label === 'Entry' && n.parent === node.id)

        if (!entry) throw new Error('Entry not found')

        const [inp, inputConnection] = getInputNode(context, node.id, BIND_KEY)

        await editor.removeConnection(inputConnection.id)

        await editor.addConnection(new Connection(inp, inputConnection.sourceOutput, entry, BIND_KEY))

        entry.label = node.label
        entry.type = 'expression'

        structures(editor).children(n => n.id === node.id).nodes().forEach(n => n.parent = node.parent)
        await editor.removeNode(node.id)
      }
    })(context)
  }
}
