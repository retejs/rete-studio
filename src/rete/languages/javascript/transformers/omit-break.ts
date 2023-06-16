import { ASTNodeBase, BIND_KEY, Context, findLabeledStatement, forEach, getInputNode, getOutputNode, ToASTContext } from '../../../core'
import { BaseNode, Output } from '../../../nodes'
import { Schemes } from '../../../types'
import { removeNodeWithConnections } from '../../../utils'
import { Transformer } from './interface'
import { Connection } from '../../../connections'
import { socket } from '../../../sockets'

export class OmitBreak<ASTNode extends ASTNodeBase, S extends Schemes> extends Transformer<Context<ASTNode, S>, ToASTContext<ASTNode, S>> {
  constructor() {
    super('Omit break')
  }

  async up(context: Context<ASTNode, S>) {
    await (forEach<ASTNode, S>(n => n.label === 'BreakStatement', async (node, context) => {
      const { editor, createConnection } = context
      const labeledStatement = findLabeledStatement(context, node.id)
      const [end, endCon] = getOutputNode(context, labeledStatement.id, 'alternate', false)
      const [source, sourceCon] = getInputNode(context, node.id, BIND_KEY)

      if (end && endCon) {
        await editor.addConnection(createConnection(source, sourceCon.sourceOutput, end, endCon.targetInput))
      } else {
        // console.warn('Could not find end of labeled statement')
      }
      const [labelNode] = getOutputNode(context, node.id, 'label', false)
      if (labelNode) await removeNodeWithConnections(editor, labelNode.id)
      await removeNodeWithConnections(editor, node.id)
    }))(context)
  }

  async down(context: ToASTContext<ASTNode, S>): Promise<void> {
    // add Break statement
    await (async ({ editor }) => {
      const nodes = editor.getNodes().filter(n => n.label === 'LabeledStatement')

      for (const labelNode of nodes) {
        const [end] = getOutputNode({ editor }, labelNode.id, 'alternate', false)
        const [label] = getOutputNode({ editor }, labelNode.id, 'label')

        if (!end) {
          // console.log('Not end for ', labelNode, '???')
          continue
        }


        const cons = editor.getConnections().filter(c => c.target === end.id && c.targetInput === BIND_KEY)

        for (const c of cons) {
          const source = editor.getNode(c.source)
          if (['LabeledStatement'].includes(source.label)) continue
          if (['ContinueStatement'].includes(source.label)) continue
          const [prev] = getInputNode({ editor }, source.id, BIND_KEY, false)
          if (prev && prev.label === 'LabeledStatement') continue

          const closure = new BaseNode('Closure')
          const breakNode = new BaseNode('BreakStatement')

          const identNode = new BaseNode('Identifier')

          identNode.data.name = label.data.name
          identNode.type = 'expression'
          breakNode.addOutput('label', new Output(socket, 'label', true))
          breakNode.type = 'statement'
          closure.parent = source.parent
          identNode.parent = closure.id
          breakNode.parent = closure.id

          await editor.addNode(closure)
          await editor.addNode(breakNode)
          await editor.addNode(identNode)

          await editor.removeConnection(c.id)
          await editor.addConnection(new Connection(breakNode, 'label', identNode, BIND_KEY))
          await editor.addConnection(new Connection(source, c.sourceOutput, breakNode, BIND_KEY))
          await editor.addConnection(new Connection(breakNode, BIND_KEY, end, BIND_KEY))
        }
      }
    })(context)
  }
}
