import { NodeEditor } from 'rete'
import { createRoot } from 'react-dom/client'
import { AreaPlugin, AreaExtensions } from 'rete-area-plugin'
import { ConnectionPlugin, Presets as ConnectionPresets } from 'rete-connection-plugin'
import { ReactArea2D, ReactPlugin, Presets as ReactPresets } from 'rete-react-plugin'
import { ContextMenuPlugin, ContextMenuExtra } from 'rete-context-menu-plugin'
import { ScopesPlugin, Presets as ScopePresets } from 'rete-scopes-plugin'
import { Schemes, Language, ControlSocket, InputControl, InsertControl, RefSocket, SelectControl } from 'rete-studio-core'
import { areConnected, debugNodes } from './utils'
import { structures } from 'rete-structures'
import { useInnerPorts } from './inner-ports'
import { addCustomBackground } from './custom-background'
import { getDOMSocketPosition } from 'rete-render-utils'
import { Drag as AreaDrag } from 'rete-area-plugin';
import { HistoryExtensions, HistoryPlugin, Presets as HistoryPresets } from 'rete-history-plugin'
import { items as contextMenuItems } from './context-menu'
import * as UI from './ui'
import { createArrangePlugin, innerPortWidth, layout, padding } from './layout'
import { serialize, deserialize, applyInteraction } from 'rete-studio-core'

export type AreaExtra = ReactArea2D<Schemes> | ContextMenuExtra

function create(language: Language<any, any, any>, editor: NodeEditor<Schemes>, area: AreaPlugin<Schemes, AreaExtra>) {
  const { code, toAST, toGraph, astTools } = language.initCodePlugin()
  const workerEditor = new NodeEditor<Schemes>()

  workerEditor.use(code)

  async function codeToAST(code: string) {
    return astTools.purify(await astTools.parse(code))
  }

  return {
    codeToExecutable: async (code: string) => {
      const ast = await codeToAST(code)

      return astTools.generate(await astTools.executable(ast))
    },
    async graphToCode() {
      const ast = await toAST()
      const generatedCode = astTools.generate(ast)

      console.log(ast)
      console.log(generatedCode)

      return generatedCode
    },
    async codeToGraph(code: string) {
      console.time('codeToGraph')
      const ast = await codeToAST(code)

      await toGraph(ast)
      console.timeEnd('codeToGraph')

      const data = serialize(workerEditor)

      await editor.clear()
      await deserialize(editor, data)

      applyInteraction(editor, id => area.update('node', id))
    }
  }
}

export async function createEditor<ParseResult, N extends { type: string }, F extends N>(container: HTMLElement, language: Language<ParseResult, N, F>) {
  const editor = new NodeEditor<Schemes>()
  const area = new AreaPlugin<Schemes, AreaExtra>(container)
  const connection = new ConnectionPlugin<Schemes, AreaExtra>()
  const reactPlugin = new ReactPlugin<Schemes, AreaExtra>({ createRoot })
  const contextMenu = new ContextMenuPlugin<Schemes>({
    items: contextMenuItems(language.snippets, async code => {
      const tempEditor = new NodeEditor<Schemes>()
      const tempArea = new AreaPlugin<Schemes, AreaExtra>(document.createElement('div'))
      const arrange = createArrangePlugin(tempEditor, innerPorts)
      const { codeToGraph } = create(language, tempEditor, tempArea)

      tempEditor.use(tempArea)
      tempArea.use(arrange)

      await codeToGraph(code)
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
  connection.addPreset(ConnectionPresets.classic.setup())


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

  const { codeToGraph, graphToCode, codeToExecutable } = create(language, editor, area)

  debugNodes(editor, area)

  editor.addPipe(c => {
    if (c.type === 'connectioncreate') {
      if (areConnected(editor, c.data.target, c.data.source)) c.data.isLoop = true
    }
    return c
  })

  return {
    async codeToGraph(code: string) {
      await codeToGraph(code)
      console.log(await layout(editor, area, arrange, innerPorts, true))
    },
    graphToCode,
    codeToExecutable,
    layout: () => layout(editor, area, arrange, innerPorts, true),
    clear: () => editor.clear(),
    destroy: () => area.destroy()
  }
}
