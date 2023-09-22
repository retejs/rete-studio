
import { ClassicPreset } from 'rete'
import {
  Schemes, Connection, BaseNode, Output, socket, LanguageSnippet, BaseOptions, CodePlugin
} from 'rete-studio-core'

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
  }
}

export const astTools = {
  async parse(code: string) {
    code
    return {
      type: 'TestRoot',
      prop: {
        type: 'TestProp'
      }
    }
  },
  async generate(ast: any) {
    ast
    return '// any code'
  },
  async purify(ast: any) {
    return ast
  },
  async unpurify(ast: any) {
    return ast
  },
  async executable(ast: any) {
    return ast
  }
}

export function initCodePlugin() {
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
      }
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
      }
    }
  })

  async function toGraph(ast: any) {
    await code.toGraph(ast)
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
