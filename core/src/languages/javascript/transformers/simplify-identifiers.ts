import { NodeId, getUID } from 'rete'
import { ASTNodeBase, BIND_KEY, Context, getOutputNode, ToASTContext } from '../../../core'
import { forEach, simplifyIdentifiers } from '../../../core/methods'
import { BaseNode, RefSocket, Socket } from '../../../nodes'
import { Schemes } from '../../../types'
import { Transformer } from './interface'
import { Connection } from '../../../connections'
import { structures } from 'rete-structures'

export class SimplifyIdentifiers<ASTNode extends ASTNodeBase, S extends Schemes> extends Transformer<Context<ASTNode, S>, ToASTContext<ASTNode, S>> {
  constructor() {
    super('Simplify identifiers')
  }

  private addRefSocket(nodeId: NodeId, outputKey: string, identifier: string, context: Context<ASTNode, S>) {
    const node = context.editor.getNode(nodeId)
    const output = node.outputs[outputKey]

    if (output && !(output.socket instanceof RefSocket)) {
      const socket = new RefSocket('Reference')
      socket.identifier = identifier

      output.socket = socket
    }
  }

  async up(context: Context<ASTNode, S>) {
    await (simplifyIdentifiers<ASTNode, S>(
      (node, context) => {
        const { editor } = context
        if (node.label !== 'Identifier') return false
        const outcomingCons = editor.getConnections().filter(c => c.source === node.id)

        return outcomingCons.length === 0
      },
      (node, context) => {
        const { editor } = context
        if (node.label !== 'Identifier') return false

        const incomingCons = editor.getConnections().filter(c => c.target === node.id)

        if (incomingCons.length > 0) return false

        const [targetNode, targetConnection] = getOutputNode(context, node.id, BIND_KEY)
        const isNonReferenceIdentifier = (targetNode.label === 'ObjectProperty' && !targetNode.data.computed)
          || (targetNode.label === 'MemberExpression' && targetConnection.targetInput === 'property')
          || (targetNode.label === 'ImportSpecifier' && targetConnection.targetInput === 'imported')
          || (targetNode.label === 'ExportSpecifier' && targetConnection.targetInput === 'exported')

        return !isNonReferenceIdentifier
      },
      (identifier, connection) => {
        const nodeId = connection.source
        const key = connection.sourceOutput
        this.addRefSocket(nodeId, key, String(identifier.data.name), context)
      }
    ))(context)

    await forEach<ASTNode, S>(n => ['VariableDeclarator'].includes(n.label), (node) => {
      this.addRefSocket(node.id, 'id', `var${getUID()}`, context)
    })(context)
  }

  async down(context: ToASTContext<ASTNode, S>): Promise<void> {
    // de-simplify identifiers
    await (async (context) => {
      const { editor } = context
      const identifiers = context.editor.getNodes().map(node => {
        return Object.entries(node.outputs)
          .filter(([_, output]) => output && output.socket instanceof RefSocket)
          .map(([key, output]) => ({ node, key, output }))
          .filter(({ node, key }) => {
            const outgoers = structures(editor).outgoers(node.id, (_, c) => c.sourceOutput === key)

            return outgoers.filter(n => ['ArrayPattern', 'ObjectPattern'].includes(n.label)).nodes().length === 0
          })
      }).flat()

      async function addIdentifier(name: string, parent?: NodeId) {
        const node = new BaseNode('Identifier')

        node.type = 'expression'
        node.data.name = name
        node.parent = parent

        await editor.addNode(node)

        return node
      }
      for (const ident of identifiers) {
        const { key, node, output } = ident
        const identifierConnections = editor.getConnections().filter(c => c.source === node.id && c.sourceOutput === key)

        const outputIdentifier = await addIdentifier(output?.socket instanceof RefSocket && output.socket.identifier || '', node.parent)
        await editor.addConnection(new Connection(node, key, outputIdentifier, BIND_KEY))

        for (const connection of identifierConnections) {
          const target = editor.getNode(connection.target)
          const identifier = (output?.socket as RefSocket)?.identifier
          if (!identifier) throw new Error('No identifier')
          const inputIdentifier = await addIdentifier(identifier, target.parent)

          await editor.addConnection(new Connection(inputIdentifier, BIND_KEY, target, connection.targetInput))
          await editor.removeConnection(connection.id)
        }
        if (output) output.socket = new Socket('any')
      }
    })(context)
  }
}
