import { ASTNodeBase, Context, ToASTContext } from '../../../core'
import { Schemes } from '../../../types'
import { Transformer } from './interface'

export class MarkFrames<ASTNode extends ASTNodeBase, S extends Schemes> extends Transformer<Context<ASTNode, S>, ToASTContext<ASTNode, S>> {
  constructor() {
    super('apply frames')
  }

  async up(context: Context<ASTNode, S>) {
    const { editor } = context

    for (const node of editor.getNodes()) {
      const hasLeft = ['ClassExpression', 'Constructor', 'FunctionExpression', 'ArrowFunctionExpression'].includes(node.label)
      const hasRight = ['ClassExpression'].includes(node.label)
      const isFrame = hasLeft || hasRight || ['Closure'].includes(node.label)

      if (isFrame) node.frame = {
        left: hasLeft,
        right: hasRight
      }
    }
  }

  async down(context: ToASTContext<ASTNode, S>): Promise<void> {
    context
  }
}
