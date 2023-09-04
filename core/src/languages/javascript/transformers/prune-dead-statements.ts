import { structures } from 'rete-structures'
import { ASTNodeBase, Context, ToASTContext } from '../../../core'
import { belongToSameClosure, getClosureDifference2 } from '../../../core/elaborate'
import { Schemes } from '../../../types'
import { removeNodeWithConnections } from '../../../utils'
import { Transformer } from './interface'

export class PruneDeadStatements<ASTNode extends ASTNodeBase, S extends Schemes> extends Transformer<Context<ASTNode, S>, ToASTContext<ASTNode, S>> {
  constructor() {
    super('Prune closures')
  }

  async up(context: Context<ASTNode, S>) {
    const { editor } = context

    const roots = structures(editor)
      .filter(n => n.type === 'statement' || n.label === 'Entry')
      .roots().filter(n => n.label !== 'Entry')
      .nodes()

    if (roots.length < 2) return

    const top = roots.reduce((a, b) => {
      const diff = getClosureDifference2(a, b, context)

      if (diff.left.length > diff.right.length) {
        return b
      }
      return a
    })

    for (const root of roots.filter(n => n !== top)) {
      const parent = root.parent && editor.getNode(root.parent)
      if (parent) {
        const nodes = structures(editor)
          .successors(root.id, n => belongToSameClosure(root, n, context))
          .union({ nodes: [root], connections: [] }).nodes()

        for (const node of nodes) {
          await removeNodeWithConnections(editor, node.id)
        }
      }
    }
  }

  async down(context: ToASTContext<ASTNode, S>): Promise<void> {
    context
  }
}
