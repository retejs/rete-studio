import {
  ASTNodeBase, BIND_KEY, Connection, Context, forEach,
  getInputNode, Input, mergeSiblingNodes, Schemes, socket, ToASTContext,
  Utils
} from 'rete-studio-core'

import { Transformer } from './interface'

export class ExpressionIntoStatement<ASTNode extends ASTNodeBase, S extends Schemes> extends Transformer<Context<ASTNode, S>, ToASTContext<ASTNode, S>> {
  constructor() {
    super('Expression into statement')
  }

  async up(context: Context<ASTNode, S>) {
    await (forEach<ASTNode, S>(n => n.label === 'ExpressionStatement', async (node, context) => {
      const [expression] = getInputNode(context, node.id, 'expression', false)

      if (!expression) return // when expression is literal which has been converted to input
      if (expression.type !== 'expression') return // when expression is reference
      if (![
        'AssignmentExpression', 'CallExpression',
        'UpdateExpression', 'YieldExpression',
        'NewExpression'
      ].includes(expression.label)) return

      await mergeSiblingNodes<ASTNode, S>(expression, node)(context)
      await Utils.removeInputConnections(context.editor, node.id, ['expression'])
      node.removeInput('expression')

      node.label = expression.label
    }))(context)
  }

  async down(context: ToASTContext<ASTNode, S>): Promise<void> {
    await (
      // unmerge statements
      async (context) => {
        const { editor } = context

        const nodes = editor.getNodes()
          .filter(n => n.type === 'statement')
          .filter(n => [
            'AssignmentExpression', 'CallExpression',
            'UpdateExpression', 'YieldExpression',
            'NewExpression'
          ].includes(n.label))

        for (const statement of nodes) {
          const expression = statement.clone()

          expression.type = 'expression'

          await editor.addNode(expression)
          const cons = editor.getConnections().filter(c => c.target === statement.id && c.targetInput !== BIND_KEY)

          for (const c of cons) {
            await editor.removeConnection(c.id)
            await editor.addConnection(new Connection(editor.getNode(c.source), c.sourceOutput, expression, c.targetInput))
          }
          Object.keys(statement.inputs).forEach(key => {
            if (key !== BIND_KEY) statement.removeInput(key)
          })
          statement.label = 'ExpressionStatement'
          statement.addInput('expression', new Input(socket, 'expression', true))

          await editor.addConnection(new Connection(expression, BIND_KEY, statement, 'expression'))
        }
      })(context)
  }
}
