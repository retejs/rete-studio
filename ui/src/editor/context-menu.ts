import { NodeEditor } from 'rete';
import { AreaPlugin } from 'rete-area-plugin'
import { Item, Items } from 'rete-context-menu-plugin/_types/types';
import { LanguageSnippet, Schemes, applyInteraction } from 'rete-studio-core';

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

export function items(snippets: LanguageSnippet[], add: (code: string) => unknown | Promise<unknown>) {
  return <Items<Schemes>>(function (context, plugin) {
    const area = plugin.parentScope<AreaPlugin<Schemes, any>>(AreaPlugin)
    const editor = area.parentScope<NodeEditor<Schemes>>(NodeEditor)

    if (context === 'root') {
      return {
        searchBar: true,
        list: snippets.map(snippet => snippetToItem(snippet, add))
      }
    }


    const deleteItem: Item = {
      label: 'Delete',
      key: 'delete',
      async handler() {
        const nodeId = context.id
        const connections = editor.getConnections().filter(c => {
          return c.source === nodeId || c.target === nodeId
        })

        for (const connection of connections) {
          await editor.removeConnection(connection.id)
        }
        await editor.removeNode(nodeId)
      }
    }

    const clone = context.clone
    const cloneItem: undefined | Item = clone && {
      label: 'Clone',
      key: 'clone',
      async handler() {
        const node = clone()

        await editor.addNode(node)

        applyInteraction(editor, id => area.update('node', id))

        area.translate(node.id, area.area.pointer)
      }
    }

    return {
      searchBar: false,
      list: [
        deleteItem,
        ...(cloneItem ? [cloneItem] : [])
      ]
    }
  })
}
