import { ASTNodeBase, BIND_KEY, Context, forEach, getInputNode, ToASTContext } from '../../../core'
import { Schemes } from '../../../types'
import { Transformer } from './interface'

export class SaveVariableKind<ASTNode extends ASTNodeBase, S extends Schemes> extends Transformer<Context<ASTNode, S>, ToASTContext<ASTNode, S>> {
  constructor() {
    super('Save variable kind')
  }

  async up(context: Context<ASTNode, S>) {
    await (forEach<ASTNode, S>(node => ['VariableDeclarator'].includes(node.label), async (node, context) => {
      const [declaration] = getInputNode(context, node.id, BIND_KEY)

      node.data.kind = declaration.data.kind
    }))(context)
  }

  async down(context: ToASTContext<ASTNode, S>): Promise<void> {
    context
  }
}
