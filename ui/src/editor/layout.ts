import { NodeId } from 'rete'
import { structures } from 'rete-structures'
import { AreaPlugin, AreaExtensions } from 'rete-area-plugin'
import { Schemes, BaseNode } from 'rete-studio-core'
import { NodeEditor } from 'rete'
import { ArrangeAppliers, AutoArrangePlugin, Presets as ArrangePresets } from 'rete-auto-arrange-plugin'
import { InnerPorts } from './inner-ports'
import { AreaExtra } from '.'
import { ElkNode } from 'elkjs'

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


class ScopeArrange extends ArrangeAppliers.StandardApplier<Schemes, AreaExtra> {
  public async apply(nodes: ElkNode[], offset = { x: 0, y: 0 }) {
    const correctNodes = this.getValidShapes(nodes)

    await Promise.all(correctNodes.map(async ({ id, x, y, width, height, children }) => {
      await Promise.all([
        this.resizeNode(id, width, height),
        this.translateNode(id, offset.x + x, offset.y + y)
      ])

      if (children) {
        await this.apply(children, { x: offset.x + x, y: offset.y + y })
      }
    }))
  }
}

function ignoreLoopConnections(connection: Schemes['Connection']) {
  return !connection.isLoop
}

export const padding = {
  top: 40,
  left: 50,
  right: 50,
  bottom: 20
}

export const innerPortWidth = 200

export function createArrangePlugin(editor: NodeEditor<Schemes>, innerPorts: InnerPorts) {
  const arrange = new AutoArrangePlugin<Schemes, AreaExtra>()
  const arrangePreset = ArrangePresets.classic.setup()

  arrange.addPreset(args => {
    const data = arrangePreset(args)

    return data && {
      ...data,
      options(id) {
        const node = editor.getNode(id)
        if (!node) return {
          'elk.padding': ''
        }
        const hasLeftInnerPorts = innerPorts.hasLeftPort(node)
        const hasRightInnerPorts = innerPorts.hasRightPort(node)

        return {
          'elk.padding': `[left=${(hasLeftInnerPorts ? innerPortWidth : 0) + padding.left}, top=${padding.top}, right=${(hasRightInnerPorts ? innerPortWidth : 0) + padding.right}, bottom=${padding.bottom}]`
        }
      }
    }
  })

  return arrange
}

export async function layout(editor: NodeEditor<Schemes>, area: AreaPlugin<Schemes, AreaExtra>, arrange: AutoArrangePlugin<Schemes, AreaExtra>, innerPorts: InnerPorts, zoomAt?: boolean) {
  console.time('layout')
  const graph = structures(editor).filter(node => !innerPorts.isInnerPort(node), ignoreLoopConnections)


  graph.nodes().forEach(node => {
    if (innerPorts.hasInnerPorts(node)) {
      node.width = Math.max(node.width, 400)
      node.height = Math.max(node.height, 200)
    }
  })

  const result = await arrange.layout({
    nodes: // graph.nodes(), //
      groupStatements(graph.nodes(), graph.connections()),
    connections: graph.connections(),
    applier: new ScopeArrange()
  })

  if (zoomAt) await AreaExtensions.zoomAt(area, editor.getNodes())
  console.timeEnd('layout')

  return result
}
