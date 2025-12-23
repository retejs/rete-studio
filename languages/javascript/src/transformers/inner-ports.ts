// @ts-nocheck
import {
  ASTNodeBase, BIND_KEY, Connection,
  Context, forEach, getInputNode, Schemes, ToASTContext } from 'rete-studio-core'

import { Transformer } from './interface'

export class InnerPorts<ASTNode extends ASTNodeBase, S extends Schemes> extends Transformer<Context<ASTNode, S>, ToASTContext<ASTNode, S>> {
  constructor() {
    super('Inner ports')
  }

  async up(context: Context<ASTNode, S>) {
    const { editor } = context

    await forEach<ASTNode, S>(node => node.label === 'ClassBody', async node => {
      const [, entryConnection] = getInputNode(context, node.id, BIND_KEY)

      await editor.removeConnection(entryConnection.id)
    })(context)
  }

  async down(context: ToASTContext<ASTNode, S>): Promise<void> {
    const { editor } = context

    const classBodies = editor.getNodes().filter(node => node.label === 'ClassBody')

    for (const classBody of classBodies) {
      const entry = editor.getNodes().find(node => node.parent === classBody.parent && node.label === 'Entry')

      if (!entry) throw new Error('InnerPorts: Entry not found')

      await editor.addConnection(new Connection(entry, 'body', classBody, BIND_KEY))
    }
  }
}
