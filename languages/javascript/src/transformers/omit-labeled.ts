import { NodeEditor } from 'rete'
import {
  ASTNodeBase, BaseNode, BIND_KEY, Connection, Context, findLabeledStatement, forEach, getClosureDifferenceOld, getOutputNode,
  Output,
  patchPlaceholderPorts, Schemes, socket,
  ToASTContext, Utils } from 'rete-studio-core'
import { } from 'rete-studio-core'

import { Transformer } from './interface'

function bfs<S extends Schemes>(editor: NodeEditor<S>, startNode: S['Node'], condition: (node: S['Node']) => false | S['Node']) {
  const queue: S['Node'][] = []
  const visited = new Set<S['Node']>()

  queue.push(startNode)
  visited.add(startNode)

  while (queue.length > 0) {
    const node = queue.shift()

    if (!node) return null

    const found = condition(node)

    if (found) return found

    const connections = editor.getConnections()

    for (const connection of connections) {
      if (connection.source === node.id) {
        const { target: targetId } = connection
        const target = editor.getNode(targetId)

        if (!visited.has(target)) {
          queue.push(target)
          visited.add(target)
        }
      }
    }
  }
  return null
}

export class OmitLabeled<ASTNode extends ASTNodeBase, S extends Schemes> extends Transformer<Context<ASTNode, S>, ToASTContext<ASTNode, S>> {
  constructor() {
    super('Omit labeled')
  }

  async up(context: Context<ASTNode, S>) {
    await (forEach<ASTNode, S>(n => n.label === 'LabeledStatement', async (node, context) => {
      const { editor, createConnection } = context
      const inps = editor.getConnections().filter(c => c.target === node.id && c.targetInput === BIND_KEY)
      const [outputNode, outputCon] = getOutputNode(context, node.id, 'body', false)

      if (outputNode && outputCon) {
        for (const inp of inps) {
          const c = createConnection(editor.getNode(inp.source), inp.sourceOutput, outputNode, outputCon.targetInput, inp)

          await editor.addConnection(c)
        }
      }
      const [labelNode] = getOutputNode(context, node.id, 'label')

      await Utils.removeNodeWithConnections(editor, labelNode.id)
      await Utils.removeNodeWithConnections(editor, node.id)
    }))(context)
  }

  async down(context: ToASTContext<ASTNode, S>): Promise<void> {
    // add LabeledStatement FIX extra closures
    const { editor } = context

    await (patchPlaceholderPorts<S>(node => {
      if (node.label === 'IfStatement') {
        return { outputs: [{ key: 'alternate', flow: true }] }
      }
    }))(context)

    async function createLabeledClosure(entry: S['Node']) {
      const entryParent = entry.parent ? editor.getNode(entry.parent) : null

      const closure = new BaseNode('Closure')
      const labeledStatement = new BaseNode('LabeledStatement')
      const ident = new BaseNode('Identifier')

      ident.data.name = `loop${labeledStatement.id}`

      const end = bfs(context.editor, entry, n => {
        if (n.label === 'IfStatement') {
          const [end, c] = getOutputNode(context, n.id, 'alternate')

          if (c.isLoop) return false
          const diff = getClosureDifferenceOld(n, end, context)

          return diff.length > 0 ? end : false // TODO recheck new getClosureDifference
        }
        return false
      })

      if (!entryParent) throw new Error('Entry parent not found')
      closure.parent = entryParent.parent
      entryParent.parent = closure.id

      labeledStatement.type = 'statement'
      ident.type = 'expression'

      labeledStatement.parent = closure.id
      ident.parent = closure.id

      labeledStatement.addOutput('label', new Output(socket, 'label', true))
      labeledStatement.addOutput('body', new Output(socket, 'body', true))
      labeledStatement.addOutput('alternate', new Output(socket, 'alternate', true))

      await editor.addNode(closure)
      await editor.addNode(labeledStatement)
      await editor.addNode(ident)
      await editor.addConnection(new Connection(labeledStatement, 'label', ident, BIND_KEY))
      await editor.addConnection(new Connection(labeledStatement, 'body', entry, BIND_KEY))
      if (end) {
        await editor.addConnection(new Connection(labeledStatement, 'alternate', end, BIND_KEY))
      } else {
        // console.log('No end found', entry.id, entry.label);
        // add Placeholder if created LabeledStatement is end of Program
        await (patchPlaceholderPorts<S>(node => {
          if (node.label === 'LabeledStatement') return { outputs: [{ key: 'alternate', flow: true }] }
        }))(context)
      }

      return {
        labeledStatement
      }
    }

    const loops = editor.getConnections().filter(c => c.isLoop)

    for (const loop of loops) {
      const entry = editor.getNode(loop.target)
      const inputs = editor.getConnections().filter(c => c.target === entry.id && c.targetInput === BIND_KEY)
      const existing = findLabeledStatement(context, entry.id, true)

      if (existing) continue

      const { labeledStatement } = await createLabeledClosure(entry)

      for (const inp of inputs) {
        await editor.removeConnection(inp.id)
        await editor.addConnection(new Connection(editor.getNode(inp.source), inp.sourceOutput, labeledStatement, BIND_KEY, inp))
      }
    }
  }
}
