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

export function flowToTree<S extends ClassicSchemes, ASTNode extends ASTNodeBase>(options: {
  isRoot(node: S['Node'], context: ToASTContext<ASTNode, S>): boolean
  isBranch(node: S['Node'], context: ToASTContext<ASTNode, S>): boolean
  isBlock(node: S['Node'], context: ToASTContext<ASTNode, S>): boolean
  getBranchNames(node: S['Node'], context: ToASTContext<ASTNode, S>): string[]
  getBlockParameterName(node: S['Node'], context: ToASTContext<ASTNode, S>): { array: boolean, key: string }
  isValidSubflow(entry: S['Node'], flow: S['Node'], context: ToASTContext<ASTNode, S>): boolean
}) {
  const { isRoot, isBranch, isBlock, getBranchNames, getBlockParameterName, isValidSubflow } = options

  // eslint-disable-next-line max-statements
  return async (context: ToASTContext<ASTNode, S>) => {
    const { editor } = context

    function matchFlowOutputs(c: S['Connection']) {
      return c.sourceOutput === BIND_KEY
    }
    function getNextFlow(node: S['Node']) {
      const c = editor.getConnections().find(c => c.source === node.id && matchFlowOutputs(c))

      if (!c) return null
      return editor.getNode(c.target)
    }
    function findNearestClosure(node: S['Node'], entries: S['Node'][]) {
      const nextEntries = [...entries]

      for (let i = nextEntries.length - 1; i >= 0; i--) {
        if (belongToSameClosure(nextEntries[i], node, context)) {
          break;
        } else {
          nextEntries.pop()
        }
      }

      return nextEntries
    }
    function traverse(node: S['Node'], entries: S['Node'][], stop: S['Node'] | null): { flow: S['Node'], entry: S['Node'] }[] {
      if (node === stop) return []
      const flow = isBranch(node, context)
        ? getBranchExit(node, getBranchNames(node, context), context)
        : getNextFlow(node)

      if (!flow) return []

      const nextEntries = findNearestClosure(flow, entries)
      const getCurrentEntry = () => nextEntries[nextEntries.length - 1]

      const validSubflow = isValidSubflow(getCurrentEntry(), flow, context)
      if (!validSubflow) {
        nextEntries.pop()
      }

      const statements = [{ flow, entry: getCurrentEntry() }]

      function extractStatements(flow: S['Node'], stop: S['Node'] | null): { flow: S['Node'], entry: S['Node'] }[] {
        const statements = []
        if (isBlock(flow, context)) {
          statements.push(...traverse(flow, [...nextEntries, flow], stop))
        } else if (isBranch(flow, context)) {
          const keys = getBranchNames(flow, context)
          const branches = editor.getConnections()
            .filter(c => c.source === flow.id && keys.includes(c.sourceOutput))
            .map(c => editor.getNode(c.target))

          statements.push(...traverse(flow, nextEntries, stop))
          for (const branch of branches) {
            statements.push(...extractStatements(branch, flow))
          }
        } else {
          statements.push(...traverse(flow, nextEntries, stop))
        }

        return statements
      }

      statements.push(...extractStatements(flow, stop))

      return statements
    }
    const roots = editor.getNodes().filter(node => isRoot(node, context))

    for (const root of roots) {
      const flows = traverse(root, [root], null)
      const noDuplicates = flows.filter((f, i) => {
        // removing duplicates at the beginning is essential to preserve the order of statements
        return findLastIndex(flows, f2 => f2.flow === f.flow && f2.entry === f.entry) === i
      })

      for (const { flow, entry } of noDuplicates) {
        const { array, key } = getBlockParameterName(entry, context)

        await reconnect(entry, flow, array, key, context)
      }
    }
  }
}

function findLastIndex<T>(array: T[], predicate: (value: T, index: number, obj: T[]) => boolean) {
  for (let i = array.length - 1; i >= 0; i--) {
    if (predicate(array[i], i, array)) return i
  }
  return -1
}

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
