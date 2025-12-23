// @ts-nocheck
import { ASTNodeBase, Context, removeRedunantNodes, Schemes, ToASTContext } from 'rete-studio-core'

import { Transformer } from './interface'

export class ClearUnknown<ASTNode extends ASTNodeBase, S extends Schemes> extends Transformer<Context<ASTNode, S>, ToASTContext<ASTNode, S>> {
  constructor() {
    super('Clear unknown')
  }

  async up(context: Context<ASTNode, S>) {
    await (
      removeRedunantNodes<S, ASTNode>(node => node.type === 'unknown' && Boolean(node.data.reasonCode))
    )(context)
  }

  async down(context: ToASTContext<ASTNode, S>): Promise<void> {
    context
  }
}
