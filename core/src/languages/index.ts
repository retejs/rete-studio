import { NodeEditor } from 'rete'
import { AreaPlugin } from 'rete-area-plugin'
import { CodePlugin } from '../core'
import { Schemes } from '../types'

export type LanguageSnippet = {
  label: string
  code: (() => string) | string
} | {
  label: string,
  subitems: LanguageSnippet[]
}

export type Language<K, ParseResult, N extends { type: string }, F extends N> = {
  playgroundExample: string,
  snippets: LanguageSnippet[],
  initCodePlugin: (editor: NodeEditor<Schemes>, area: AreaPlugin<Schemes, K>) => {
    code: CodePlugin<Schemes, N>
    astTools: {
      parse(code: string): ParseResult
      generate(ast: N): string
      purify(ast: ParseResult): F
      unpurify(ast: F): F
      executable(ast: F): F
    }
    unsupportedTypes: string[]
    processedTypes: Set<string>
    toGraph: (ast: F, imported?: () => void) => Promise<void>
    toAST: () => Promise<F>
  }
}
