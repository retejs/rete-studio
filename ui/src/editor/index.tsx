import { NodeEditor } from 'rete'
import { createRoot } from 'react-dom/client'
import { AreaPlugin, AreaExtensions } from 'rete-area-plugin'
import { ConnectionPlugin, Presets as ConnectionPresets } from 'rete-connection-plugin'
import { ReactArea2D, ReactPlugin, Presets as ReactPresets } from 'rete-react-plugin'
import { ContextMenuPlugin, ContextMenuExtra } from 'rete-context-menu-plugin'
import { ArrangeAppliers, AutoArrangePlugin, Presets as ArrangePresets } from 'rete-auto-arrange-plugin'
import { ScopesPlugin, Presets as ScopePresets } from 'rete-scopes-plugin'
import { Schemes, Language, ControlSocket, InputControl, InsertControl, RefSocket, SelectControl } from 'rete-studio-core'
import { groupStatements } from './layout'
import { areConnected } from './utils'
import { ElkNode } from 'elkjs'
import { structures } from 'rete-structures'
import { useInnerPorts } from './inner-ports'
import { addCustomBackground } from './custom-background'
import { getDOMSocketPosition } from 'rete-render-utils'
import { Drag as AreaDrag } from 'rete-area-plugin';
import { HistoryExtensions, HistoryPlugin, Presets as HistoryPresets } from 'rete-history-plugin'
import { items as contextMenuItems } from './context-menu'
import * as UI from './ui'
import { applyDI } from './di'

export type AreaExtra = ReactArea2D<Schemes> | ContextMenuExtra

export async function createEditor<ParseResult, N extends { type: string }, F extends N>(container: HTMLElement, language: Language<ParseResult, N, F>) {
  const editor = new NodeEditor<Schemes>()
  const area = new AreaPlugin<Schemes, AreaExtra>(container)
  const connection = new ConnectionPlugin<Schemes, AreaExtra>()
  const reactPlugin = new ReactPlugin<Schemes, AreaExtra>({ createRoot })
  const contextMenu = new ContextMenuPlugin<Schemes>({
    items: contextMenuItems(language.snippets, async code => {
      const tempEditor = new NodeEditor<Schemes>()
      const tempArea = new AreaPlugin<Schemes, AreaExtra>(document.createElement('div'))
      const arrange = createArrangePlugin()
      const { code: plugin, toGraph, astTools } = language.initCodePlugin()

      tempEditor.use(plugin)
      tempEditor.use(tempArea)
      tempArea.use(arrange)

      const ast = await astTools.purify(await astTools.parse(code))

      await layout(tempEditor, arrange)
      await toGraph(ast)

      const graph = structures(tempEditor) // .filter(node => !(node.type === 'statement' && node.label === 'Expression'))

      for (const node of graph.nodes()) {
        await editor.addNode(node.clone(true))
      }
      for (const connection of graph.connections()) {
        await editor.addConnection(connection)
      }
      applyDI(editor, area)
      console.log(tempArea)
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


  function ignoreLoopConnections(connection: Schemes['Connection']) {
    return !connection.isLoop
  }

  function createArrangePlugin() {
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

  const arrange = createArrangePlugin()

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


  editor.use(area)
  area.use(contextMenu)
  area.use(reactPlugin)
  area.use(connection)
  area.use(arrange)
  area.use(history)


  const padding = {
    top: 40,
    left: 50,
    right: 50,
    bottom: 20
  }
  const innerPortWidth = 200

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

  const { code, toAST, toGraph, astTools } = language.initCodePlugin()

  editor.use(code)

  function update() {
    editor.getNodes().forEach(async node => {
      await area.update('node', node.id)
    })
    layout(editor, arrange)
  }

  async function prepareAst(code: string) {
    console.log('[AST]', astTools.parse(code));

    const ast = await astTools.purify(await astTools.parse(code))

    console.log('[purified]', await astTools.generate(ast))
    console.log('[purified AST]', ast);

    const executableAst = await astTools.executable(ast)
    console.log('[executable]', await astTools.generate(executableAst))
    console.log('[executable AST]', executableAst);

    return ast
  }

  async function loadCode(code: string) {
    const ast = await prepareAst(code)

    await toGraph(ast, async () => {
      console.log(await layout(editor, arrange))
    })
    applyDI(editor, area)
  }


  class A extends ArrangeAppliers.StandardApplier<Schemes, AreaExtra> {
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

  async function layout(editor: NodeEditor<Schemes>, arrange: AutoArrangePlugin<Schemes, AreaExtra>) {
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
      applier: new A()
    })

    await AreaExtensions.zoomAt(area, editor.getNodes())
    console.timeEnd('layout')

    return result
  }

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

  editor.addPipe(c => { // Pro example
    if (c.type === 'connectioncreate') {
      if (areConnected(editor, c.data.target, c.data.source)) c.data.isLoop = true
    }
    return c
  })

  return {
    getCurrentStep: () => code.getCurrentStep(),
    maxStep: code.getTransformers().length - 1,
    stepNames: code.getTransformers().map(t => t.name),
    loadCode,
    stepUp: async () => {
      await code.step(1)
      update()
    },
    stepDown: async () => {
      await code.step(-1)
      update()
    },
    startStepByStep: async (path: string, examples: { path: string, input: string }[]) => {
      const item = examples.find(ex => ex.path === path)

      if (!item) throw new Error('Example not found')
      const ast = await prepareAst(item.input)
      await code.applyAST(ast)
      await layout(editor, arrange)
    },
    currentGraphToCode: async () => {
      const ast = await code.retrieveAST()
      const generatedCode = astTools.generate(ast)

      console.log(ast)
      console.log(generatedCode)

      return generatedCode
    },
    layout: () => layout(editor, arrange),
    toCode: async () => {
      const ast = await toAST()
      const generatedCode = astTools.generate(ast)

      console.log(ast)
      console.log(generatedCode)

      return generatedCode
    },
    async toExecutable(code: string) {
      const ast = await astTools.purify(await astTools.parse(code))

      return astTools.generate(await astTools.executable(ast))
    },
    clear: () => editor.clear(),
    destroy: () => area.destroy()
  }
}
