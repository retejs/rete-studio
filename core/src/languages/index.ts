import { NodeEditor } from 'rete'

import { CodePlugin } from '../core'
import { deserialize, JSONEditorData, serialize } from '../serialization'
import { Schemes } from '../types'

export type LanguageSnippet = {
  label: string
  code: (() => string) | string
} | {
  label: string,
  subitems: LanguageSnippet[]
}

export type Language<ParseResult, N extends { type: string }, F extends N> = {
  playgroundExample: string,
  snippets: LanguageSnippet[],
  initCodePlugin: () => {
    code: CodePlugin<Schemes, N>
    astTools: {
      parse(code: string): Promise<ParseResult>
      generate(ast: N): Promise<string>
      purify(ast: ParseResult): Promise<F>
      unpurify(ast: F): Promise<F>
      executable(ast: F): Promise<F>
    }
    unsupportedTypes: string[]
    processedTypes: Set<string>
    toGraph: (ast: F) => Promise<void>
    toAST: () => Promise<F>
  }
}

export interface LanguageAdapter {
  getExample(): Promise<string>;
  getSnippets(): Promise<LanguageSnippet[]>;
  codeToExecutable(code: string): Promise<string>;
  graphToCode(data: JSONEditorData): Promise<string>;
  codeToGraph(code: string): Promise<JSONEditorData>;
  _getTransformerNames(): Promise<string[]>;
  _applySnapshot(direction: 'down' | 'up', id: string): Promise<JSONEditorData>;
}

export function createAdapter(language: Language<any, any, any>): LanguageAdapter {
  const { code, toAST, toGraph, astTools } = language.initCodePlugin()
  const workerEditor = new NodeEditor<Schemes>()

  workerEditor.use(code)

  return {
    async getExample() {
      return language.playgroundExample
    },
    async getSnippets() {
      return language.snippets
    },
    async codeToExecutable(code) {
      const ast = await astTools.purify(await astTools.parse(code))

      return astTools.generate(await astTools.executable(ast))
    },
    async graphToCode(data) {
      await workerEditor.clear()
      await deserialize(workerEditor, data)

      const ast = await toAST()
      const generatedCode = astTools.generate(ast)

      return generatedCode
    },
    async codeToGraph(code) {
      const ast = await astTools.purify(await astTools.parse(code))

      await workerEditor.clear()
      await toGraph(ast)

      return serialize(workerEditor)
    },
    async _getTransformerNames() {
        return Array.from(code.getTransformers().map(t => t.name))
      },
    async _applySnapshot(direction, name) {
      const editor = code.snapshots.get(direction + ' ' + name)

      if (!editor) throw new Error('Snapshot not found')
      return serialize(editor)
    }
  }
}
