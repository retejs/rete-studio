/**
 * @jest-environment jsdom
 */
import { describe, it, expect } from '@jest/globals'
import { NodeEditor } from 'rete'
import { initCodePlugin } from '../code-plugin'
import { Schemes } from '../../../types'
// import { writeFileSync } from 'fs'
import { loadExamplesList } from './utils'
import { AreaPlugin } from 'rete-area-plugin'
// import { join } from 'path'

function matchCode(code: string): string {
  const labels = Array.from(new Set([
    ...(code.match(/(\w*): (\{|if |while )/g) || []).map(l => /^(\w*): (\{|if |while )$/.exec(l)?.[1]),
    ...(code.match(/(break|continue) (\w*)/g) || []).map(l => /(break|continue) (\w*)$/.exec(l)?.[2])
  ])).filter(Boolean) as string[]

  return labels.reduce((c, id, i) => {
    const sub = `__${i}`

    return (c as any)
      .replaceAll(`${id}: {`, `${sub}: {`)
      .replaceAll(`${id}: if `, `${sub}: if `)
      .replaceAll(`${id}: while `, `${sub}: while `)
      .replaceAll(`break ${id}`, `break ${sub}`)
      .replaceAll(`continue ${id}`, `continue ${sub}`)
  }, code).trim()
}

describe('test', () => {
  const examples = loadExamplesList()

  for (const { path, input, output } of examples) {
    it(path, async () => {
      const editor = new NodeEditor<Schemes>()
      const { code: plugin, toAST, toGraph, astTools } = initCodePlugin(editor, new AreaPlugin(document.createElement('div')))

      editor.use(plugin)

      const ast = astTools.purify(astTools.parse(input))

      await toGraph(ast)
      const newCode = astTools.generate(await toAST())

      // writeFileSync(join(__dirname, '..', 'examples', `${path}.out`), newCode, { encoding: 'utf-8' })

      expect(matchCode(newCode)).toEqual(matchCode(output))
    })
  }
})
