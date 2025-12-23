// @ts-nocheck
/* eslint-disable max-statements */
import { createRoot } from 'react-dom/client'
import { NodeEditor } from 'rete'
import { AreaExtensions, AreaPlugin, Drag as AreaDrag } from 'rete-area-plugin'
import { ClassicFlow, ConnectionPlugin, getSourceTarget } from 'rete-connection-plugin'
import { ContextMenuExtra, ContextMenuPlugin } from 'rete-context-menu-plugin'
import { HistoryExtensions, HistoryPlugin, Presets as HistoryPresets } from 'rete-history-plugin'
import { Presets as ReactPresets, ReactArea2D, ReactPlugin } from 'rete-react-plugin'
import { getDOMSocketPosition } from 'rete-render-utils'
import { Presets as ScopePresets, ScopesPlugin } from 'rete-scopes-plugin'
import { structures } from 'rete-structures'
import {
  applyInteraction, Connection, ControlSocket, deserialize,
  InputControl, InsertControl,
  LanguageAdapter, LanguageSnippet, RefSocket, Schemes, SelectControl,
  serialize
} from 'rete-studio-core'

import { items as contextMenuItems } from './context-menu'
import { addCustomBackground } from './custom-background'
import { useInnerPorts } from './inner-ports'
import { createArrangePlugin, innerPortWidth, layout, padding } from './layout'
import * as UI from './ui'
import { areConnected, debugNodes } from './utils'

export type AreaExtra = ReactArea2D<Schemes> | ContextMenuExtra

async function graphFromCode(code: string, language: LanguageAdapter, editor: NodeEditor<Schemes>, area: AreaPlugin<Schemes, AreaExtra>) {
  const data = await language.codeToGraph(code)

  if (!data) throw new Error('Failed to parse code')

  await editor.clear()
  await deserialize(editor, data)

  applyInteraction(editor, id => area.update('node', id))
}

async function graphFromSnapshot(direction: 'up' | 'down', id: string, language: LanguageAdapter, editor: NodeEditor<Schemes>, area: AreaPlugin<Schemes, AreaExtra>) {
  const data = await language._applySnapshot(direction, id)

  if (!data) throw new Error('Failed to parse code')

  await editor.clear()
  await deserialize(editor, data)

  applyInteraction(editor, id => area.update('node', id))
}

export async function createEditor(container: HTMLElement, snippets: LanguageSnippet[], language: LanguageAdapter) {
  const editor = new NodeEditor<Schemes>()
  const area = new AreaPlugin<Schemes, AreaExtra>(container)
  const connection = new ConnectionPlugin<Schemes, AreaExtra>()
  const reactPlugin = new ReactPlugin<Schemes, AreaExtra>({ createRoot })
  const contextMenu = new ContextMenuPlugin<Schemes>({
    items: contextMenuItems(snippets, async code => {
      const tempEditor = new NodeEditor<Schemes>()
      const tempArea = new AreaPlugin<Schemes, AreaExtra>(document.createElement('div'))
      const arrange = createArrangePlugin(tempEditor, innerPorts)

      tempEditor.use(tempArea)
      tempArea.use(arrange)

      await graphFromCode(code, language, tempEditor, tempArea)
      await layout(tempEditor, area, arrange, innerPorts)

      const graph = structures(tempEditor)

      for (const node of graph.nodes()) {
        await editor.addNode(node.clone(true))
        const view = tempArea.nodeViews.get(node.id)

        if (view) {
          area.translate(node.id, {
            x: area.area.pointer.x + view.position.x,
            y: area.area.pointer.y + view.position.y
          })
        }
      }
      for (const connection of graph.connections()) {
        await editor.addConnection(connection)
      }
      applyInteraction(editor, id => area.update('node', id))
    })
  })
  const history = new HistoryPlugin()

  HistoryExtensions.keyboard(history);
  history.addPreset(HistoryPresets.classic.setup())

  // connection.addPreset(() => new BidirectFlow())
  connection.addPreset(() => new ClassicFlow({
    makeConnection(from, to, context) {
      const [source, target] = getSourceTarget(from, to) || [null, null]
      const { editor } = context

      if (source && target) {
        editor.addConnection(new Connection(editor.getNode(source.nodeId), source.key, editor.getNode(target.nodeId), target.key))
        return true
      }
    }
  }))

  area.area.setDragHandler(new AreaDrag({
    down: e => {
      // if (e.pointerType === 'mouse' && e.button !== 1) return false
      e.preventDefault()
      return true
    },
    move: () => true
  }))

  editor.use(area)

  const innerPorts = useInnerPorts(area, {
    hasLeftPort(node) {
      return Boolean(node.frame?.left)
    },
    hasRightPort(node) {
      return Boolean(node.frame?.right)
    },
    isLeftPort(node) {
      return ['Entry'].includes(node.label)
    },
    isRightPort(node) {
      return ['ClassBody'].includes(node.label)
    },
    padding
  })

  const arrange = createArrangePlugin(editor, innerPorts)

  // debugId(area)
  addCustomBackground(area)

  reactPlugin.addPreset(ReactPresets.classic.setup({
    socketPositionWatcher: getDOMSocketPosition({
      offset({ x, y }, _nodeId, side) {
        return {
          x: x + 10 * (side === 'input' ? -1 : 1),
          y: y
        }
      },
    }),
    // socketPositionWatcher: useComputedSocketPositions({ position: (node) => ({ header: 40, socket: 20, socketOuter: 36, offsetRelative: 'none' }) }) as any,
    customize: {
      control(data) {
        if (data.payload instanceof InsertControl) {
          return UI.InsertButton
        }
        if (data.payload instanceof SelectControl) {
          return UI.SelectComponent
        }
        if (data.payload instanceof InputControl) {
          return UI.InputControlComponent
        }
        return UI.CustomInput
      },
      node(data) {
        if (innerPorts.isInnerPort(data.payload)) {
          return UI.InnerPortNode
        }
        if (data.payload.type === 'statement') {
          return UI.StatementNode
        }
        if (data.payload.type === 'expression') {
          return UI.Node
        }
        if (data.payload.frame) {
          return UI.FrameNode
        }

        return UI.UnknownNode as any
      },
      socket(data) {
        if (data.payload instanceof ControlSocket) {
          return UI.ControlSocketComponent
        }
        return UI.CustomSocket
      },
      connection(data) {
        const { source, sourceOutput, target, targetInput } = data.payload
        const sourceNode = editor.getNode(source)
        const targetNode = editor.getNode(target)

        const outputSocket = sourceNode?.outputs[sourceOutput]?.socket
        const inputSocket = targetNode?.inputs[targetInput]?.socket

        if (outputSocket instanceof RefSocket) {
          return UI.ReferenceConnection
        }
        if (outputSocket instanceof ControlSocket || inputSocket instanceof ControlSocket) {
          return UI.StatementConnection
        }
        return UI.ExpressionConnection
      }
    }
  }))
  reactPlugin.addPreset(ReactPresets.contextMenu.setup({
    delay: 200,
    customize: {
      main: () => UI.ContextMenu.Menu as any,
      item: () => UI.ContextMenu.Item as any,
      common: () => UI.ContextMenu.Common as any,
      search: () => UI.ContextMenu.Search as any,
      subitems: () => UI.ContextMenu.Subitems as any
    }
  }))

  AreaExtensions.simpleNodesOrder(area)
  AreaExtensions.selectableNodes(area, AreaExtensions.selector(), { accumulating: AreaExtensions.accumulateOnCtrl() })
  AreaExtensions.showInputControl<Schemes>(area, ({ hasAnyConnection, input }) => {
    return input.alwaysVisibleControl ? true : !hasAnyConnection
  })
  // AreaExtensions.snapGrid(area, { size: 20, dynamic: true })

  area.use(contextMenu)
  area.use(reactPlugin)
  area.use(connection)
  area.use(arrange)
  area.use(history)

  const scopes = new ScopesPlugin<Schemes>({
    exclude: (id) => innerPorts.isInnerPort(editor.getNode(id)),
    size(id, size) {
      const node = editor.getNode(id)

      if (innerPorts.hasLeftPort(node)) {
        return { width: Math.max(size.width, 400), height: Math.max(size.height, 200) }
      }
      return size
    },
    padding(id) {
      const node = editor.getNode(id)

      return {
        top: padding.top,
        left: (innerPorts.hasLeftPort(node) ? innerPortWidth : 0) + padding.left,
        right: (innerPorts.hasRightPort(node) ? innerPortWidth : 0) + padding.right,
        bottom: padding.bottom
      }
    }
  })
  scopes.addPreset(ScopePresets.classic.setup())

  area.use(scopes)

  debugNodes(editor, area)

  editor.addPipe(c => {
    if (c.type === 'connectioncreate') {
      if (areConnected(editor, c.data.target, c.data.source)) c.data.isLoop = true
    }
    return c
  })

  return {
    async codeToGraph(code: string) {
      await graphFromCode(code, language, editor, area)
      console.log('layout:', await layout(editor, area, arrange, innerPorts, true))
    },
    async graphToCode() {
      const data = serialize(editor)
      const code = await language.graphToCode(data)

      return code
    },
    debug: {
      async graphFromSnapshot(direction: 'up' | 'down', id: string) {
        console.log({ direction, id })
        await graphFromSnapshot(direction, id, language, editor, area)
        console.log('layout:', await layout(editor, area, arrange, innerPorts, true))
      },
      async getTransformerNames() {
        return language._getTransformerNames()
      }
    },
    async codeToExecutable(code: string) {
      return language.codeToExecutable(code)
    },
    layout: () => layout(editor, area, arrange, innerPorts, true),
    clear: () => editor.clear(),
    destroy: () => area.destroy()
  }
}
