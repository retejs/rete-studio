import { structures } from 'rete-structures'
import {
  ASTNodeBase, BaseNode, BIND_KEY, Context, forEach, getBranchExit, getClosureDifference,
  Schemes, ToASTContext
} from 'rete-studio-core'

import { Transformer } from './interface'

export class OmitRestoreClosures<ASTNode extends ASTNodeBase, S extends Schemes> extends Transformer<Context<ASTNode, S>, ToASTContext<ASTNode, S>> {
  constructor() {
    super('omit-restore closures')
  }

  async up(context: Context<ASTNode, S>) {
    // omit closures if possible
    await (forEach<ASTNode, S>(node => node.label === 'Closure', async (node, context) => {
      const { editor } = context

      const children = structures(editor).children(m => m.id === node.id).nodes()

      if (children.some(child => child.label === 'VariableDeclarator')) return
      children.forEach(m => {
        m.parent = node.parent
      })
      await editor.removeNode(node.id)
    }))(context)
    // omit closures if in FunctionExpression
    await (forEach<ASTNode, S>(node => ['FunctionExpression', 'ArrowFunctionExpression'].includes(node.label), async (node, context) => { // TODO ArrowFunctionExpression ?
      const { editor } = context
      const children = structures(editor).children(m => m.id === node.id).nodes()

      for (const child of children) {
        if (child.label === 'Closure') {
          structures(editor).children(m => m.id === child.id).nodes().forEach(m => {
            m.parent = node.id
          })
          await editor.removeNode(child.id)
        }
      }
    }))(context)
  }

  async down(context: ToASTContext<ASTNode, S>): Promise<void> {
    // restore closures
    await (async (context) => {
      const { editor } = context
      // TODO reusable

      async function putIntoClosure(closure: S['Node'], statements: S['Node'][]) {
        const childrenWithExpressions = statements.map(n => {
          return [n, ...(structures(editor) as any).predecessors(n.id, (pred: any) => pred.type === 'expression').nodes()]
        }).flat()
        const parents = Array.from(new Set(childrenWithExpressions.map(n => n.parent)))
          .filter((id): id is string => Boolean(id))
          .map(id => editor.getNode(id))
        const parentsChildren = parents.map(parent => ({ parent, children: structures(editor).children(n => n.id === parent.id).nodes() }))
        const filledParents = Object.fromEntries(parentsChildren
          .filter(({ children }) => children.every(n => [...parents, ...childrenWithExpressions].includes(n)))
          .map(({ parent, children }) => [parent.id, children]))

        childrenWithExpressions.forEach(node => {
          const getParent = (parent?: string): null | string => parent && filledParents[parent] ? (getParent(editor.getNode(parent).parent) || parent) : null
          const parent = getParent(node.parent)

          if (parent) {
            editor.getNode(parent).parent = closure.id
          } else {
            node.parent = closure.id
          }
        })
      }

      async function toClosure(children: S['Node'][], parent?: string) {
        const closure = new BaseNode('Closure')

        closure.parent = parent
        closure.removeInput(BIND_KEY)
        closure.removeOutput(BIND_KEY)

        await editor.addNode(closure)
        await putIntoClosure(closure, children)
      }

      const ifStatements = editor.getNodes().filter(n => n.label === 'IfStatement' || n.label === 'TryStatement')

      const pairs = ifStatements.map(ifStatement => {
        const keys = ifStatement.label === 'IfStatement' ? ['consequent', 'alternate'] : ['block', 'handler', 'finalizer']

        return [ifStatement, { keys }] as const
      })
      // const allExists = pairs.map(([ifStatement, { keys }]) => getBranchExit(ifStatement, keys, context)).filter(Boolean)

      for (const [ifStatement, { keys }] of pairs) {
        const st = structures({ nodes: editor.getNodes(), connections: editor.getConnections().filter(c => !c.isLoop) })
        const exit = getBranchExit(ifStatement, keys, context)
        const subgraphs = keys.map(key => st.successors(ifStatement.id, (n, c) => {
          if (exit && exit.id === n.id) return false
          // if (allExists.length && allExists.includes(n)) return false
          if (getClosureDifference(ifStatement, n, context).left.length > 0) return false
          if (c.source === ifStatement.id) return c.sourceOutput === key
          return true
        }))

        for (const subgraph of subgraphs) {
          if (subgraph.nodes().length > 0) {
            await toClosure(subgraph.nodes(), ifStatement.parent)
          }
        }
      }

      const connections = editor.getConnections()
      const loops = connections.filter(c => c.isLoop)

      for (const loop of loops) {
        const start = editor.getNode(loop.target)
        const st = structures({
          nodes: editor.getNodes(),
          connections: connections.filter(c => !c.isLoop)
        })

        if (start.label === 'IfStatement' || start.label === 'TryStatement') {
          const end = getBranchExit(start, start.label === 'IfStatement' ? ['consequent', 'alternate'] : ['block', 'handler', 'finalizer'], context)

          const forward = st.successors(start.id, n => {
            if (end && end.id === n.id) return false
            return true
          }).union({ nodes: [start], connections })

          await toClosure(forward.nodes(), start.parent)
        } else {
          const end = editor.getNode(loop.source)
          const forward = st.successors(start.id).union({ nodes: [start], connections })
          const backward = st.predecessors(end.id).union({ nodes: [end], connections })

          const children = forward.intersection({
            getNodes: backward.nodes,
            getConnections: backward.connections
          }).nodes()

          await toClosure(children, start.parent)
        }
      }

      const entries = editor.getNodes().filter(n => n.label === 'Entry')

      for (const entry of entries) {
        if (!entry.outputs['body']) {
          console.warn('entry without body', entry)
          continue
        }
        const nodes = structures(editor).successors(entry.id, (n, c) => (c.source === entry.id ? c.sourceOutput === 'body' : true) && n.type === 'statement').nodes()

        await toClosure(nodes, entry.parent)
      }
    })(context)
  }
}
