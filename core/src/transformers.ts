/* eslint-disable max-statements */
import { structures } from 'rete-structures'

import { C, Closures, Marker, N } from './utils2'

export function treeToFlow<Node extends N, Con extends C>(data: { nodes: Node[], connections: Con[], closures: Closures }, props: {
 isBlock: (node: Node) => false | RegExp | string
 isStartNode: (node: Node) => boolean
 createConnection: (source: Node, sourceOutput: string, target: Node, targetInput: string, options?: { isLoop?: boolean, identifier?: string }) => Con
}) {
  console.time('treeToFlow')
  const graph = structures({
    nodes: [...data.nodes],
    connections: [...data.connections]
  })
  const roots = graph.nodes().filter(props.isStartNode)

  const markers: Record<string, Marker[]> = {}

  function traverse(node: Node, context: Marker[] = []) {
    const outgoerConnections = graph.connections().filter(c => c.source === node.id)

    for (let index = 0; index < outgoerConnections.length; index++) {
      const out = outgoerConnections[index]
      const source = graph.nodes().find(n => n.id === out.source)!
      const m: Marker[] = props.isBlock(source) ? [...context, { index, context: out }] : context
      const node = graph.nodes().find(n => n.id === out.target)!

      markers[node.id] = m
      traverse(node, m)
    }
  }
  for (const root of roots) {
    traverse(root)
  }

  let mutableGraph = structures({
    nodes: graph.nodes(),
    connections: graph.connections()
  })
  const leaves = mutableGraph.leaves().nodes()

  for (const leaf of leaves) {
    for (const marker of [...markers[leaf.id]].reverse()) {
      const isStillLeaf = mutableGraph.leaves().nodes().includes(leaf)

      if (!isStillLeaf) continue

      const entries = Object.entries(markers)
      const next = mutableGraph.nodes().find(n => n.id === marker.context.source)!.id
      const reconnect = entries.find(([, list]) => list.find(m => m.context.source === next && m.index === marker.index + 1))
      const nextContext = reconnect?.[1]?.[reconnect?.[1].length - 1].context

      if (nextContext) {
        mutableGraph = structures({
          nodes: mutableGraph.nodes(),
          connections: [
            ...mutableGraph.connections().filter(c => c.id !== nextContext.id),
            props.createConnection(leaf, 'bind', mutableGraph.nodes().find(n => n.id === nextContext.target)!, 'bind')
          ]
        })
      }
    }
  }

  // normalize body indices
  for (const c of [...mutableGraph.connections()]) {
    const source = mutableGraph.nodes().find(n => n.id === c.source)!
    const isBlock = props.isBlock(source)

    if (isBlock && c.sourceOutput.match(isBlock)) {
      mutableGraph = structures({
        nodes: mutableGraph.nodes(),
        connections: [
          ...mutableGraph.connections().filter(con => con.id !== c.id),
          props.createConnection(mutableGraph.nodes().find(n => n.id === c.source)!, 'bind', mutableGraph.nodes().find(n => n.id === c.target)!, 'bind')
        ]
      })
    }
  }

  console.timeEnd('treeToFlow')
  return {
    nodes: mutableGraph.nodes(),
    connections: mutableGraph.connections()
  }
}

export function flowToTree<Node extends N, Con extends C>(data: { nodes: Node[], connections: Con[], closures: Closures }, props: {
  isBranchNode: (node: Node) => boolean,
  isBlock: (node: Node) => boolean | RegExp,
  isCompatible(source: Node, target: Node): boolean,
  getBlockParameterName: (node: Node) => { array: boolean, key: string },
  isRoot: (node: Node) => boolean,
  createConnection: (source: Node, sourceOutput: string, target: Node, targetInput: string, options?: { isLoop?: boolean, identifier?: string }) => Con
}) {
  console.time('flowToTree')
  const nodes = [...data.nodes]
  const connections = [...data.connections]
  const graph = structures({
    nodes,
    connections
  })

  function getNodesParents(scopesNodes: Closures) {
    const nestedNodes: Record<string, string[]> = {}

    // Helper function to recursively process nested scopes
    function processScope(scopeId: string, nodeIds?: Set<string>) {
      (nodeIds || []).forEach(id => {
        if (!scopesNodes[id]) {
          nestedNodes[id] = [scopeId, ...(nestedNodes[id] || [])]
        } else {
          processScope(scopeId, scopesNodes[id])
        }
      })
    }

    for (const scopeId in scopesNodes) {
      processScope(scopeId, scopesNodes[scopeId])
    }

    return nestedNodes
  }

  const nodeParents = getNodesParents(data.closures)

  const visited = new Map<Node['id'], Node[]>()

  function markBranchingScopes(node: Node, scopes: { start: Node, exit: Node }[] = []) {
    if (visited.has(node.id)) return

    const isBranchNode = props.isBranchNode(node)
    const outgoers = graph.outgoers(node.id)

    for (const scope of [...scopes]) {
      if (scope.exit.id === node.id) scopes = scopes.filter(s => s !== scope)
    }

    const exit = isBranchNode && outgoers.nodes().length > 1 ? outgoers.nodes()
      .map(n => graph.successors(n.id).union({ nodes: [n], connections: [] }))
      .reduce((a, b) => a.intersection({ nodes: b.nodes(), connections: b.connections() }))
      .roots().nodes()[0] : null

    visited.set(node.id, scopes.map(s => s.start))

    for (const outgoer of outgoers.nodes()) {
      markBranchingScopes(outgoer, exit ? [...scopes, { start: node, exit }] : scopes)
    }
  }

  const roots = graph.nodes().filter(props.isRoot)

  for (const root of roots) {
    markBranchingScopes(root)
  }

  const indices = new Map<Node['id'], number>()

  function traverse(node: Node, startNode: Node, markers = new Set<string>(), traversed = new Set<Node['id']>()) {
    if (traversed.has(node.id)) return markers
    traversed.add(node.id)
    const isStart = node.id === startNode.id

    const incomers = graph.connections().filter(c => c.target === node.id)

    for (let index = 0; index < incomers.length; index++) {
      const inc = incomers[index]
      const source = graph.nodes().find(n => n.id === inc.source)!

      // TODO subtract scopes
      const sameScope = (visited.get(inc.source) || []).length <= (visited.get(startNode.id) || []).length
        && (nodeParents[inc.source] || []).length <= (nodeParents[startNode.id] || []).length

      if (isStart && props.isBranchNode(source)) {
        continue
      } else if (props.isBlock(source) && sameScope && props.isCompatible(source, startNode)) {
        markers.add(inc.source)
      } else {
        const n = graph.nodes().find(n => n.id === inc.source)!

        traverse(n, startNode, markers, traversed)
      }
    }
    return markers
  }


  let mutableGraph = structures({
    nodes: graph.nodes(),
    connections: graph.connections()
  })
  let leaves: Node[] = []
  const processed = new Set<Node['id']>()

  while ((leaves = mutableGraph.difference({
    nodes: mutableGraph.nodes().filter(n => processed.has(n.id)),
    connections: mutableGraph.connections()
  }).leaves().nodes(), leaves.length > 0)) {
    const leaf = leaves[0]
    const markers = traverse(leaf, leaf)

    processed.add(leaf.id)

    for (const marker of Array.from(markers)) {
      const predecessorsIds = mutableGraph.predecessors(marker).nodes().map(n => n.id)
      const isMain = predecessorsIds.every(id => !markers.has(id))

      if (isMain) {
        const index = (indices.get(marker) || 0) - 1
        const source = mutableGraph.nodes().find(n => n.id === marker)!
        const outputMeta = props.getBlockParameterName(source)

        if (!outputMeta.array) throw new Error('Not supported yet')

        indices.set(marker, index)

        mutableGraph = structures({
          nodes: mutableGraph.nodes(),
          connections: [
            ...mutableGraph.connections().filter(c => c.target !== leaf.id),
            props.createConnection(source, `${outputMeta.key}[${index}]`, leaf, 'bind')
          ]
        })
        break
      }
    }
  }

  // normalize body indices
  for (const c of [...mutableGraph.connections()]) {
    const minIndex = indices.get(c.source) || 0
    const source = mutableGraph.nodes().find(n => n.id === c.source)!
    const outputMeta = props.getBlockParameterName(source)

    if (!outputMeta.array) throw new Error('Not supported yet')
    const bodyRegexp = new RegExp('^' + outputMeta.key + '\\[(-+\\d+)\\]$')

    if (c.sourceOutput.match(bodyRegexp)) {
      const index = c.sourceOutput.match(bodyRegexp)![1]

      mutableGraph = structures({
        nodes: mutableGraph.nodes(),
        connections: [
          ...mutableGraph.connections().filter(con => con.id !== c.id),
          props.createConnection(mutableGraph.nodes().find(n => n.id === c.source)!, `${outputMeta.key}[${parseInt(index) - minIndex}]`, mutableGraph.nodes().find(n => n.id === c.target)!, 'bind')
        ]
      })
    }
  }

  console.timeEnd('flowToTree')
  return {
    nodes: mutableGraph.nodes(),
    connections: mutableGraph.connections()
  }
}
