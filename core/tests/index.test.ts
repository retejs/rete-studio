/* eslint-disable max-statements */
// import { parse } from '@babel/parser'
// eslint-disable-next-line no-undef
globalThis.crypto = require('crypto')
import { describe, expect, it } from '@jest/globals'

import { flowToTree, treeToFlow } from '../src/transformers'
import { N, comparable, getData, sanitize, stringifyChart } from '../src/utils2'
import { getUID } from 'rete'

const numberOfIfs = 25

const assets = [
  ['if', `
  flowchart LR

  Program -->|body[0]| IfStatement1
  Program -->|body[1]| IfStatement2
  IfStatement1 -->|consequent| Block1
  IfStatement1 -->|alternate| Placeholder1
  Block1 -->|body[0]| Statement1
  IfStatement2 -->|consequent| Block2
  IfStatement2 -->|alternate| Placeholder2
  Block2 -->|body[0]| Statement2
  `, `
  flowchart LR

  IfStatement1 -->|consequent| Block1
  IfStatement1 -->|alternate| Placeholder1
  IfStatement2 -->|consequent| Block2
  IfStatement2 -->|alternate| Placeholder2
  Placeholder1 -->|bind| IfStatement2
  Statement1 -->|bind| IfStatement2
  Program -->|bind| IfStatement1
  Block1 -->|bind| Statement1
  Block2 -->|bind| Statement2
  `],
  ['t', `
  flowchart LR

  Program -->|body[0]| Statement1
  Program -->|body[1]| If1
  If1 -->|consequent| Block1
  Block1 -->|body[0]| Statement2
  Block1 -->|body[1]| Statement2.5
  If1 -->|alternate| Placeholder1
  Program -->|body[2]| Statement3
  `,
  `
  flowchart LR

  Program -->|bind| Statement1
  If1 -->|consequent| Block1
  Block1 -->|bind| Statement2
  If1 -->|alternate| Placeholder1
  Statement1 -->|bind| If1
  Statement2 -->|bind| Statement2.5
  Statement2.5 -->|bind| Statement3
  Placeholder1 -->|bind| Statement3
  `],
  ['program statements',`
    flowchart LR

    Program -->|body[0]| Statement1
    Program -->|body[1]| Statement2
    Program -->|body[2]| Statement3
  `, `
  flowchart LR

  Program -->|bind| Statement1
  Statement1 -->|bind| Statement2
  Statement2 -->|bind| Statement3
  `],
  ['tree to flow1', `
    flowchart LR

    Program -->|body[0]| If1
    If1 -->|consequent| Block1
    Block1 -->|body[0]| Statement1
    Block1 -->|body[1]| Statement2
    If1 -->|alternate| Placeholder1
  `, `
    flowchart LR

    Program -->|bind| If1
    If1 -->|consequent| Block1
    Block1 -->|bind| Statement1
    If1 -->|alternate| Placeholder1
    Statement1 -->|bind| Statement2
  `],

  ['tree to flow', `
    flowchart LR

    Program -->|body[0]| If1
    If1 -->|consequent| Block1
    If1 -->|alternate| Placeholder0
    Block1 -->|body[0]| Statement1
    Block1 -->|body[1]| If2
    If2 -->|consequent| Block2
    Block2 -->|body[0]| Statement2
    If2 -->|alternate| Placeholder1
    Block1 -->|body[2]| If3
    If3 -->|consequent| Block3
    Block3 -->|body[0]| Statement3
    If3 -->|alternate| Placeholder2

    subgraph 1
    Block2
    Statement2
    end
    subgraph 2
    Block3
    Statement3
    end
  `, `
    flowchart LR

    Program -->|bind| If1
    If1 -->|consequent| Block1
    If1 -->|alternate| Placeholder0
    Block1 -->|bind| Statement1
    If2 -->|consequent| Block2
    Block2 -->|bind| Statement2
    If2 -->|alternate| Placeholder1
    If3 -->|consequent| Block3
    Block3 -->|bind| Statement3
    If3 -->|alternate| Placeholder2
    Statement1 -->|bind| If2
    Statement2 -->|bind| If3
    Placeholder1 -->|bind| If3

    subgraph 1
    Block2
    Statement2
    end
    subgraph 2
    Block3
    Statement3
    end
  `],

  ['program', `
    flowchart LR

    Program -->|body[0]| If1
    Program -->|body[1]| If2
    If1 -->|consequent| Statement1
    If1 -->|alternate| Placeholder1
  `, `
    flowchart LR

    Program -->|bind| If1
    If1 -->|consequent| Statement1
    If1 -->|alternate| Placeholder1
    Statement1 -->|bind| If2
    Placeholder1 -->|bind| If2
  `],
  ['a lot of Ifs', `
  flowchart LR

  ${new Array(numberOfIfs).fill(null).map((_, i) => `Program -->|body[${i}]| If${i}
  If${i} -->|consequent| Block${i}
  If${i} -->|alternate| Placeholder${i}`).join('\n')}
  `,`flowchart LR

  Program -->|bind| If0
  ${new Array(numberOfIfs - 1).fill(null).map((_, i) => `
    If${i} -->|consequent| Block${i}
    If${i} -->|alternate| Placeholder${i}
    Block${i} -->|bind| If${i+1}
    Placeholder${i} -->|bind| If${i+1}
  `.trim()).join('\n')}
  If${numberOfIfs - 1} -->|consequent| Block${numberOfIfs - 1}
  If${numberOfIfs - 1} -->|alternate| Placeholder${numberOfIfs - 1}
  `
],
['nested if', `
  flowchart LR

  If1 -->|consequent| Block1
  If1 -->|alternate| Block2
  If2 -->|consequent| Block3
  If2 -->|alternate| Block4
  Block1 -->|body[0]| If2
  Block1 -->|body[1]| Statement1
  Program -->|body[0]| If1
`, `
  flowchart LR

  If1 -->|consequent| Block1
  If1 -->|alternate| Block2
  If2 -->|consequent| Block3
  If2 -->|alternate| Block4
  Block1 -->|bind| If2
  Program -->|bind| If1
  Block3 -->|bind| Statement1
  Block4 -->|bind| Statement1
`],
['trailing statement', `
  flowchart LR

  If1 -->|consequent| Block1
  If1 -->|alternate| Block2
  If2 -->|consequent| Block3
  If2 -->|alternate| Block4
  Program -->|body[0]| If1
  Program -->|body[1]| If2
  Program -->|body[2]| Statement1
`, `
  flowchart LR

  If1 -->|consequent| Block1
  If1 -->|alternate| Block2
  If2 -->|consequent| Block3
  If2 -->|alternate| Block4
  Program -->|bind| If1
  Block1 -->|bind| If2
  Block2 -->|bind| If2
  Block3 -->|bind| Statement1
  Block4 -->|bind| Statement1
`],
['closure', `
  flowchart LR

  Program -->|body[0]| Block1
  Block1 -->|body[0]| Block2
  Block1 -->|body[1]| Statement4
  Block2 -->|body[0]| Statement3

  subgraph 1
  Block2
  Statement3
  end
  subgraph 2
  1
  Block1
  Statement4
  end
  `, `
  flowchart LR

  Program -->|bind| Block1
  Block1 -->|bind| Block2
  Block2 -->|bind| Statement3
  Statement3 -->|bind| Statement4

  subgraph 1
  Block2
  Statement3
  subgraph 2
  1
  Block1
  Statement4
  end
  end
  `
],
['variable', `
  flowchart LR

  Program -->|body[0]| VariableDeclaration1
  VariableDeclaration1 -->|declarations[0]| VariableDeclarator
  Program -->|body[1]| IfStatement1
  IfStatement1 -->|consequent| Statement1
`, `
  flowchart LR

  VariableDeclaration1 -->|declarations[0]| VariableDeclarator
  IfStatement1 -->|consequent| Statement1
  VariableDeclarator -->|bind| IfStatement1
  Program -->|bind| VariableDeclaration1
`]
]

const props = {
  isStartNode: (source: N) => Boolean(source.id.match(/^(Program)/)),
  isBlock: (source: N) => source.id.match(/^(Block|Program|VariableDeclaration)/) ? /^body\[\d+\]$/ : false,
  isBranchNode: (node: N) => Boolean(node.id.match(/^(If)/)),
  isRoot: (node: N) => Boolean(node.id.match(/^(Program)/)),
  isCompatible: (source: N, target: N) => {
    // TODO refactor
    // console.log(source.id, target.id)
    if (source.id.startsWith('VariableDeclaration')) return target.id.startsWith('VariableDeclarator')
    return true
  },
  getBlockParameterName(node: N) {
    if (node.id.startsWith('Program')) return { array: true, key: 'body' }
    if (node.id.startsWith('VariableDeclaration')) return { array: true, key: 'declarations' }
    if (node.id.startsWith('CatchClause')) return { array: false, key: 'body' }
    if (node.id.startsWith('ObjectPattern')) return { array: true, key: 'properties' }
    return { array: true, key: 'body' }
  },
  createConnection: (source: N, sourceOutput: string, target: N, targetInput: string) => {
    return { source: source.id, sourceOutput, target: target.id, targetInput, id: getUID() }
  }
}

describe('tree to flow', () => {
  assets.forEach(([name, input, output]) => {
    it(name, async () => {
      const inputSanitized = sanitize(input)
      const expectedSanitized = sanitize(output)

      const data = getData(inputSanitized)
      const flow = treeToFlow(data, props)
      const result = stringifyChart(flow.connections, data.closures)

      console.log(result)

      expect(comparable(result)).toEqual(comparable(expectedSanitized))
    })
  })
})

describe('flow to tree', () => {
  assets.forEach(([name, input, output]) => {
    it(name, async () => {
      const inputSanitized = sanitize(output)
      const expectedSanitized = sanitize(input)

      const data = getData(inputSanitized)
      const flow = flowToTree(data, props)
      const result = stringifyChart(flow.connections, data.closures)

      console.log(result)

      expect(comparable(result)).toEqual(comparable(expectedSanitized))
    })
  })
})
