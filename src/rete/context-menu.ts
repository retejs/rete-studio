import { BaseSchemes } from 'rete';
import { Presets } from 'rete-context-menu-plugin';
import { Item, Items } from 'rete-context-menu-plugin/_types/types';
import { LanguageSnippet } from './languages';

function snippetToItem(snippet: LanguageSnippet, add: (code: string) => unknown | Promise<unknown>): Item {

  if ('subitems' in snippet) {
    return {
      label: snippet.label,
      key: snippet.label,
      handler: () => null,
      subitems: snippet.subitems.map(subitem => snippetToItem(subitem, add))
    }
  }
  return {
    label: snippet.label,
    key: snippet.label,
    handler: async () => {
      const code = typeof snippet.code === 'function' ? snippet.code() : snippet.code

      await add(code)
    }
  }
}


export function items(snippets: LanguageSnippet[], add: (code: string) => unknown | Promise<unknown>): Items<BaseSchemes> {
  return (context, plugin) => {
    if (context === 'root') {
      return {
        searchBar: true,
        list: snippets.map(snippet => snippetToItem(snippet, add))
      }
    }
    return Presets.classic.setup([])(context, plugin)
  }
}
