import { ASTNodeBase, Context, forEach, ToASTContext } from '../../../core'
import { Schemes } from '../../../types'
import { Transformer } from './interface'

export class MarkConstructor<ASTNode extends ASTNodeBase, S extends Schemes> extends Transformer<Context<ASTNode, S>, ToASTContext<ASTNode, S>> {
  constructor() {
    super('Mark constructor')
  }

  async up(context: Context<ASTNode, S>) {
    await (forEach<ASTNode, S>(n => ['ClassMethod'].includes(n.label), async (node) => {
      node.label = 'Constructor'
    }))(context)
  }

  async down(context: ToASTContext<ASTNode, S>): Promise<void> {
    const { editor } = context

    const nodes = editor.getNodes().filter(n => ['Constructor'].includes(n.label))

    for (const node of nodes) {
      node.label = 'ClassMethod'
    }
  }
}
