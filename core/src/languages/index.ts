import { CodePlugin } from '../core'
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
    toGraph: (ast: F, imported?: () => void) => Promise<void>
    toAST: () => Promise<F>
  }
}
