import {
  ASTNodeBase, BIND_KEY, Context, ensurePorts,
  Schemes, ToASTContext } from 'rete-studio-core'

import { Transformer } from './interface'

export class RestoreBindPorts<ASTNode extends ASTNodeBase, S extends Schemes> extends Transformer<Context<ASTNode, S>, ToASTContext<ASTNode, S>> {
  constructor() {
    super('Restore bind ports')
  }

  async up(context: Context<ASTNode, S>) {
    context
  }

  async down(context: ToASTContext<ASTNode, S>): Promise<void> {
    await (ensurePorts(() => {
      return { inputs: [BIND_KEY], outputs: [BIND_KEY] }
    }, () => null))(context)
  }
}
