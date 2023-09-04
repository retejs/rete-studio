import { NodeId } from 'rete'
import { structures } from 'rete-structures'
import { Schemes, BaseNode } from 'rete-studio-core'

// eslint-disable-next-line no-inner-declarations
function expressions(nodes: Schemes['Node'][], clones: Schemes['Node'][], connections: Schemes['Connection'][], id: NodeId, dir: 'incomers' | 'outgoers') {
  const node = nodes.find(n => n.id === id)
  if (!node) return []

  return structures({ nodes: clones, connections })[dir](id).nodes().filter(n => n.type === 'expression' && n.parent === node.parent)
}
// eslint-disable-next-line no-inner-declarations
function applyGroupToExpressions(group: BaseNode, nodes: Schemes['Node'][], clones: Schemes['Node'][], connections: Schemes['Connection'][], id: NodeId, dir: 'incomers' | 'outgoers') {
  const incomers = expressions(nodes, clones, connections, id, dir)

  incomers.forEach(inc => {
    applyGroupToExpressions(group, nodes, clones, connections, inc.id, dir)
    inc.parent = group.id
  })
}

export function groupStatements(nodes: Schemes['Node'][], connections: Schemes['Connection'][]) {
  const list: Schemes['Node'][] = []
  const clones = nodes.map(n => n.clone(true))

  for (const node of clones) {
    if (node.type === 'statement') {
      const group = new BaseNode('Group')

      group.removeOutput('output')
      group.parent = node.parent
      node.parent = group.id
      list.push(group)

      applyGroupToExpressions(group, nodes, clones, connections, node.id, 'incomers')
      applyGroupToExpressions(group, nodes, clones, connections, node.id, 'outgoers')
    }
    list.push(node)
  }

  return list
}
