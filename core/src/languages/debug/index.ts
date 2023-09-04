
import { BaseOptions, CodePlugin } from '../../core'
import { Schemes } from '../../types'
import { ClassicPreset, NodeEditor } from 'rete'
import { BaseNode, Output } from '../../nodes'
import { Connection } from '../../connections'
import { socket } from '../../sockets'
import { AreaPlugin } from 'rete-area-plugin'
import { LanguageSnippet } from '..'

type N = any

export const name = '(debug)'

const base: BaseOptions<Schemes> = {
  createInput(label) {
    return new ClassicPreset.Input(socket, label, true)
  },
  createOutput(label) {
    return new Output(socket, label, true)
  },
  createConnection(source, sourceOutput, target, targetInput, options) {
    return new Connection(source, sourceOutput, target, targetInput, options)
  },
  createNode(type) {
    return new BaseNode(type)
  },
}

export const astTools = {
  parse(_code: string) {
    return {
      type: 'TestRoot',
      prop: {
        type: 'TestProp'
      }
    }
  },
  generate(_ast: any) {
    return '// any code'
  },
  purify(ast: any) {
    return ast
  },
  unpurify(ast: any) {
    return ast
  },
  executable(ast: any) {
    return ast
  },
}

export function initCodePlugin<K>(_editor: NodeEditor<Schemes>, _area: AreaPlugin<Schemes, K>) {
  const processedTypes = new Set<string>()
  const code = new CodePlugin<Schemes, N>({
    transformers: [],
    up: {
      ...base,
      isSupported: () => true,
      isStatement(data) {
        return data.type === 'TestRoot'
      },
      isExpression(data) {
        return data.type !== 'TestRoot'
      },
      nodeCreated(node) {
        node.type && processedTypes.add(node.type)
      },
    },
    down: {
      ...base,
      createASTNode() {
        return {} as any
      },
      nodeParameters() {
        return []
      },
      defaults(node) {
        node
      },
    }
  })

  async function toGraph(ast: any, imported?: () => void) {
    await code.toGraph(ast, async () => {
      imported && imported()
    })
  }

  async function toAST() {
    const ast = await code.toAST<any>()

    return astTools.unpurify(ast)
  }

  return {
    code,
    astTools,
    unsupportedTypes: [],
    processedTypes,
    toGraph,
    toAST
  }
}

export const playgroundExample = `// debug`

export const snippets: LanguageSnippet[] = []
