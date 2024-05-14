import { NodeEditor } from 'rete'
import { structures } from 'rete-structures'

import { ClassicSchemes } from '../types'
import { ASTNodeBase, BIND_KEY, ToASTContext } from './types'

export function belongToSameClosure<S extends ClassicSchemes>(source: S['Node'], target: S['Node'], { editor }: { editor: NodeEditor<S> }) {
  if (source.parent === target.parent) return true
  if (target.parent && belongToSameClosure(source, editor.getNode(target.parent), { editor })) return true
  return false
}

export function getClosures<S extends ClassicSchemes>(node: S['Node'], context: { editor: NodeEditor<S> }): S['Node'][] {
  if (node.parent) {
    const closure = context.editor.getNode(node.parent)
    return [closure, ...getClosures(closure, context)]
  }
  return []
}

export function getClosureDifference2<S extends ClassicSchemes>(source: S['Node'], target: S['Node'], context: { editor: NodeEditor<S> }) {
  const a = getClosures(source, context).reverse()
  const b = getClosures(target, context).reverse()

  let i = 0;
  for (; i < a.length; i++) {
    if (!a[i]) break
    if (!b[i]) break
    if (a[i] !== b[i]) break
  }

  return {
    left: a.slice(i),
    right: b.slice(i)
  }
}

export function getClosureDifference<S extends ClassicSchemes>(source: S['Node'], target: S['Node'], context: { editor: NodeEditor<S> }) {
  const a = getClosures(source, context)
  const b = getClosures(target, context)

  let i = 0;
  for (; i < a.length; i++) {
    if (a[i] && b[i] && a[i] === b[i]) continue
  }
  return {
    left: a.slice(i),
    right: b.slice(i)
  }
}

export function getClosureDifferenceOld<S extends ClassicSchemes, ASTNode extends ASTNodeBase>(source: S['Node'], target: S['Node'], context: ToASTContext<ASTNode, S>) {
  const a = getClosures(source, context)
  const b = getClosures(target, context)

  return a.filter(x => !b.includes(x))
}

export function getBranchExit<S extends ClassicSchemes, ASTNode extends ASTNodeBase>(node: S['Node'], keys: string[], context: ToASTContext<ASTNode, S>) {
  const { editor } = context
  const [consKey, altKey] = keys // TODO all keys
  const alternate = editor.getConnections().find(c => c.source === node.id && c.sourceOutput === altKey)

  if (!alternate) return null

  const consequentSubgraph = structures(editor).successors(node.id, (n, c) => c.source === node.id ? c.sourceOutput === consKey : n.type === 'statement')
  const alternateSubgraph = structures(editor).successors(node.id, (n, c) => c.source === node.id ? c.sourceOutput === altKey : n.type === 'statement')

  const intersection = consequentSubgraph.intersection({
    getNodes: alternateSubgraph.nodes,
    getConnections: alternateSubgraph.connections,
  })
  const roots = intersection.roots().nodes()

  if (roots.length > 1) throw new Error('Multiple roots in getClosureDifferenceOld')

  return roots[0] || null
}

import { flowToTree as flowToTreeOrigin } from '../transformers'
// import { structures } from 'rete-structures'

export function flowToTree<S extends ClassicSchemes, ASTNode extends ASTNodeBase>(options: {
  isRoot(node: S['Node'], context: ToASTContext<ASTNode, S>): boolean
  isBranch(node: S['Node'], context: ToASTContext<ASTNode, S>): boolean
  isBlock(node: S['Node'], context: ToASTContext<ASTNode, S>): boolean
  getBranchNames(node: S['Node'], context: ToASTContext<ASTNode, S>): string[]
  getBlockParameterName(node: S['Node'], context: ToASTContext<ASTNode, S>): { array: boolean, key: string },
  isValidSubflow(source: S['Node'], target: S['Node'], context: ToASTContext<ASTNode, S>): boolean
}) {
  const { isRoot, isBranch, isBlock, isValidSubflow, getBlockParameterName } = options

  return async (context: ToASTContext<ASTNode, S>) => {
    const data = structures({
      nodes: context.editor.getNodes(),
      connections: context.editor.getConnections(),
    }).filter(n => n.type === 'statement' || options.isRoot(n, context))

    try {
      const result = flowToTreeOrigin({
        nodes: data.nodes(),
        connections: data.connections(),
        closures: {}
      }, {
        isRoot: node => isRoot(node, context),
        isBlock: node => isBlock(node, context),
        getBlockParameterName: node => getBlockParameterName(node, context),
        isCompatible: (source, target) => isValidSubflow(source, target, context),
        isBranchNode: node => isBranch(node, context),
        createConnection: (s, o, t, i, opts) => {
          if (!s.hasOutput(o)) s.addOutput(o, context.createOutput(o))
          return context.createConnection(s, o, t, i, opts)
        }
      })

      const connectionsToRemove = context.editor
        .getConnections()
        .filter(c => !result.connections.find(r => r.id === c.id) && context.editor.getNode(c.target).type === 'statement')
      const connectionsToAdd = result.connections.filter(r => !context.editor.getConnections().find(c => c.id === r.id))

      console.log('RESULT', result, { connectionsToRemove, connectionsToAdd })

      for (const c of connectionsToRemove) {
        await context.editor.removeConnection(c.id)
      }
      for (const c of connectionsToAdd) {
        await context.editor.addConnection(c)
      }

    } catch (e) {
      console.error(e)
      throw e
    }

  }
}

// function findLastIndex<T>(array: T[], predicate: (value: T, index: number, obj: T[]) => boolean) {
//   for (let i = array.length - 1; i >= 0; i--) {
//     if (predicate(array[i], i, array)) return i
//   }
//   return -1
// }

export async function reconnect<S extends ClassicSchemes, ASTNode extends ASTNodeBase>(block: S['Node'], flow: S['Node'], array: boolean, propertyName: string, context: ToASTContext<ASTNode, S>) {
  const { editor, createOutput, createConnection } = context
  for (const c of editor.getConnections().filter(c => c.target === flow.id && c.targetInput === BIND_KEY)) {
    await editor.removeConnection(c.id)
  }
  const nextIndex = editor.getConnections().filter(c => c.source === block.id && c.sourceOutput.match(array ? new RegExp(`^${propertyName}\\[.*\\]$`) : propertyName)).length

  const key = array ? `${propertyName}[${nextIndex}]` : propertyName
  if (!block.hasOutput(key)) block.addOutput(key, createOutput(key))
  await editor.addConnection(createConnection(block, key, flow, BIND_KEY))
}
