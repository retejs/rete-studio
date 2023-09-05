import { structures } from 'rete-structures'
import { ASTNodeBase, Context, markClosures, Schemes, ToASTContext } from 'rete-studio-core'

import { Transformer } from './interface'

export class MarkClosures<ASTNode extends ASTNodeBase, S extends Schemes> extends Transformer<Context<ASTNode, S>, ToASTContext<ASTNode, S>> {
  constructor() {
    super('mark-closures')
  }

  async up(context: Context<ASTNode, S>) {
    await (markClosures<S, ASTNode>({
      isStart: node => node.label === 'Program',
      isClosure: node => [
        'BlockStatement', 'LabeledStatement', 'ClassExpression',
        'ClassMethod', 'FunctionExpression', 'ArrowFunctionExpression', 'TryStatement', 'CatchClause'
      ].includes(node.label)
    }))(context)
  }

  async down(context: ToASTContext<ASTNode, S>): Promise<void> {
    await (async ({ editor }) => {
      const closures = editor.getNodes().filter(n => n.label === 'Closure')

      for (const node of closures) {
        structures(editor).children(n => n.id === node.id).nodes().forEach(n => {
          n.parent = undefined
        })
        await editor.removeNode(node.id)
      }
    })(context)
  }
}

