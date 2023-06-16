import { NodeId } from 'rete'
import { structures } from 'rete-structures'
import { BaseNode } from './nodes'
import { Schemes } from './types'

export function groupStatements(nodes: Schemes['Node'][], connections: Schemes['Connection'][]) { // Pro example
  const list: Schemes['Node'][] = []
  const clones = nodes.map(n => n.clone(true))

  for (const node of clones) {
    if (node.type === 'statement') {
      const group = new BaseNode('Group')

      group.removeOutput('output')
      group.parent = node.parent
      node.parent = group.id
      list.push(group)

      // eslint-disable-next-line no-inner-declarations
      function expressions(id: NodeId, dir: 'incomers' | 'outgoers') {
        const node = nodes.find(n => n.id === id)
        if (!node) return []

        return structures({ nodes: clones, connections })[dir](id).nodes().filter(n => n.type === 'expression' && n.parent === node.parent)
      }
      // eslint-disable-next-line no-inner-declarations
      function applyGroupToExpressions(id: NodeId, dir: 'incomers' | 'outgoers') {
        const incomers = expressions(id, dir)

        incomers.forEach(inc => {
          applyGroupToExpressions(inc.id, dir)
          inc.parent = group.id
        })
      }
      applyGroupToExpressions(node.id, 'incomers')
      applyGroupToExpressions(node.id, 'outgoers')
    }
    list.push(node)
  }

  return list
}
