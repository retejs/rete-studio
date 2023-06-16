import { ASTNodeBase, BIND_KEY, Context, findLabeledStatement, getOutputNode, ToASTContext } from '../../../core'
import { BaseNode, Output } from '../../../nodes'
import { Schemes } from '../../../types'
import { removeNodeWithConnections } from '../../../utils'
import { Transformer } from './interface'
import { Connection } from '../../../connections'
import { socket } from '../../../sockets'

export class OmitContinue<ASTNode extends ASTNodeBase, S extends Schemes> extends Transformer<Context<ASTNode, S>, ToASTContext<ASTNode, S>> {
  constructor() {
    super('Omit continue')
  }

  async up(context: Context<ASTNode, S>) {
    const { editor, createConnection } = context
    const continueStatements = editor.getNodes().filter(n => n.label === 'ContinueStatement')

    for (const node of continueStatements) {
      const labeledStatement = findLabeledStatement(context, node.id)
      const sources = editor.getConnections().filter(c => c.target === node.id && c.targetInput === BIND_KEY)

      for (const source of sources) {
        const sourceNode = editor.getNode(source.source)

        await editor.addConnection(createConnection(sourceNode, source.sourceOutput, labeledStatement, BIND_KEY, { isLoop: true }))
      }
    }
    for (const node of continueStatements) {
      const [labelNode] = getOutputNode(context, node.id, 'label', false)
      if (labelNode) await removeNodeWithConnections(editor, labelNode.id)
      await removeNodeWithConnections(editor, node.id)
    }
  }

  async down(context: ToASTContext<ASTNode, S>): Promise<void> {
    // add Continue statement
    await (async ({ editor }) => {
      const loops = editor.getConnections().filter(c => c.isLoop)

      for (const loop of loops) {
        const source = editor.getNode(loop.source)
        const target = editor.getNode(loop.target)

        if (target.label !== 'LabeledStatement') throw new Error('Unexpected target type')

        const [alternate] = getOutputNode({ editor }, target.id, 'alternate', false)
        const [label] = getOutputNode({ editor }, target.id, 'label')

        await editor.removeConnection(loop.id)

        if (!alternate) {
          // console.log('Not end for ', loop, '???')
          continue
        }


        const closure = new BaseNode('Closure')
        const continueNode = new BaseNode('ContinueStatement')
        const identNode = new BaseNode('Identifier')

        identNode.data.name = label.data.name
        identNode.type = 'expression'
        continueNode.addOutput('label', new Output(socket, 'label', true))
        continueNode.type = 'statement'
        closure.parent = source.parent
        identNode.parent = closure.id
        continueNode.parent = closure.id

        await editor.addNode(closure)
        await editor.addNode(continueNode)
        await editor.addNode(identNode)

        await editor.addConnection(new Connection(continueNode, 'label', identNode, BIND_KEY))
        await editor.addConnection(new Connection(source, loop.sourceOutput, continueNode, BIND_KEY))
        await editor.addConnection(new Connection(continueNode, BIND_KEY, alternate, BIND_KEY))
      }
    })(context)
  }
}
