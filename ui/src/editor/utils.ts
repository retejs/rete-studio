import { NodeEditor } from 'rete'
import { ClassicSchemes, Schemes } from 'rete-studio-core'
import { AreaPlugin } from 'rete-area-plugin'

export function areConnected<S extends ClassicSchemes>(editor: NodeEditor<S>, source: string, target: string, cache = new Set<string>()) {
  const list = editor.getConnections().filter(c => c.source === source && !c.isLoop).map(c => editor.getNode(c.target))
  const current = editor.getNode(source)
  if (!current) throw new Error(`Node ${source} not found`)
  const currentParent = current.parent

  if (source === target) return true
  if (cache.has(source)) return false
  cache.add(source)

  for (const node of list) {
    if (node.id === target) return true
    if (areConnected(editor, node.id, target, cache)) return true
  }
  if (currentParent && areConnected(editor, currentParent, target, cache)) return true
  return false
}

export function debugNodes(editor: NodeEditor<Schemes>, area: AreaPlugin<Schemes, any>) {
  area.addPipe(context => {
    if (context.type === 'nodepicked') {
      const node = editor.getNode(context.data.id)

      if (node.label === 'NumericLiteral') {
        console.log(node.data.value, node.type);
      } else {
        console.log(node.data, node.type, node)
      }

    }
    return context
  })
}
