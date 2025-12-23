// @ts-nocheck
import { NodeEditor } from 'rete'
import { AreaPlugin } from 'rete-area-plugin'
import { Schemes } from 'rete-studio-core'

type Padding = {
  top: number
  left: number
  right: number
  bottom: number
}

type Options<S extends Schemes> = {
  hasLeftPort: (node: S['Node']) => boolean
  hasRightPort: (node: S['Node']) => boolean
  isLeftPort: (node: S['Node']) => boolean
  isRightPort: (node: S['Node']) => boolean
  padding: Padding
}

export function useInnerPorts<S extends Schemes, A>(area: AreaPlugin<S, A>, options: Options<S>) {
  const editor = area.parentScope<NodeEditor<S>>(NodeEditor)

  area.addPipe(async context => {
    if (!context || typeof context !== 'object' || !('type' in context)) return context
    if (context.type === 'nodetranslate') {
      const node = editor.getNode(context.data.id)
      const { isLeftPort, isRightPort, padding } = options

      if (isLeftPort(node) || isRightPort(node)) {
        const parent = node.parent && editor.getNode(node.parent)
        const view = parent && area.nodeViews.get(parent.id)

        if (!view) return context

        return {
          ...context,
          data: {
            ...context.data,
            position: {
              x: isLeftPort(node) ? view.position.x + padding.left : view.position.x + parent.width - node.width - padding.right,
              y: view.position.y + padding.top,
            }
          }
        }
      }
    }
    if (context.type === 'nodetranslated' || context.type === 'noderesized') {
      const node = editor.getNode(context.data.id)
      const view = area.nodeViews.get(node.id)

      if (options.hasLeftPort(node)) {
        const entry = editor.getNodes().find(item => options.isLeftPort(item) && item.parent === node.id)
        const classBody = editor.getNodes().find(item => options.isRightPort(item) && item.parent === node.id)

        if (entry && view) {
          await area.translate(entry.id, { x: view.position.x + 20, y: view.position.y + 40 })
        }
        if (classBody) {
          if (view) await area.translate(classBody.id, { x: view.position.x + node.width - classBody.width - 20, y: view.position.y + 40 })
        }
      }
    }
    return context
  })

  return {
    isInnerPort: (node: S['Node']) => options.isLeftPort(node) || options.isRightPort(node),
    hasInnerPorts: (node: S['Node']) => options.hasLeftPort(node) || options.hasRightPort(node),
    hasLeftPort: options.hasLeftPort,
    hasRightPort: options.hasRightPort,
    isLeftPort: options.isLeftPort,
    isRightPort: options.isRightPort,
  }
}

export type InnerPorts = ReturnType<typeof useInnerPorts>
