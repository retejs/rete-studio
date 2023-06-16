import { ASTNodeBase, Context, patchPlaceholderPorts, ToASTContext } from '../../../core'
import { Schemes } from '../../../types'
import { removeNodeWithConnections } from '../../../utils'
import { Transformer } from './interface'

export class AddFlowPlaceholder<ASTNode extends ASTNodeBase, S extends Schemes> extends Transformer<Context<ASTNode, S>, ToASTContext<ASTNode, S>> {
  constructor() {
    super('Add flow placeholder')
  }

  async up(context: Context<ASTNode, S>) {
    await (patchPlaceholderPorts<S>(node => {
      if (node.label === 'IfStatement') return { outputs: [{ key: 'alternate', flow: true }] }
      if (node.label === 'TryStatement') return { outputs: [{ key: 'finalizer', flow: true }] }
      if (node.label === 'LabeledStatement') return { outputs: [{ key: 'alternate', flow: true }] }
    }))(context)
  }

  async down({ editor }: ToASTContext<ASTNode, S>): Promise<void> {
    for (const node of [...editor.getNodes()]) {
      if (node.label === 'Placeholder') {
        await removeNodeWithConnections(editor, node.id)
      }
    }
  }
}
