import { ASTNodeBase, BIND_KEY, Context, ControlSocket, Schemes, ToASTContext } from 'rete-studio-core'

import { Transformer } from './interface'

export class MarkControlSockets<ASTNode extends ASTNodeBase, S extends Schemes> extends Transformer<Context<ASTNode, S>, ToASTContext<ASTNode, S>> {
  constructor() {
    super('Mark control sockets')
  }

  async up(context: Context<ASTNode, S>) {
    const { editor } = context
    const socket = new ControlSocket('control flow')

    for (const node of editor.getNodes()) {
      if (node.type === 'statement') {
        if (node.inputs[BIND_KEY]) node.inputs[BIND_KEY].socket = socket
        if (node.outputs[BIND_KEY]) node.outputs[BIND_KEY].socket = socket
      }
      if (['IfStatement'].includes(node.label)) {
        node.outputs['consequent']!.socket = socket
        node.outputs['consequent']!.label = 'true'
        node.outputs['alternate']!.socket = socket
        node.outputs['alternate']!.label = 'false'
      }
      if (['TryStatement'].includes(node.label)) {
        node.outputs['block']!.socket = socket
        node.outputs['handler']!.socket = socket
        node.outputs['finalizer']!.socket = socket
      }
      if (['Entry'].includes(node.label)) {
        if (node.outputs['body']) {
          node.outputs['body'].socket = socket
          node.outputs['body'].index = -1
        }
      }
    }
  }

  async down(context: ToASTContext<ASTNode, S>): Promise<void> {
    context
  }
}
