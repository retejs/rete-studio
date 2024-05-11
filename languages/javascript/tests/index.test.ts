/* eslint-disable max-statements */
// import { parse } from '@babel/parser'
import { describe, expect, it } from '@jest/globals'

import { flowToTree, treeToFlow } from './transformers'
import { comparable, getData, sanitize, stringifyChart } from './utils'

const numberOfIfs = 100

const assets = [
  ['t', `
  flowchart LR

  Program --> Statement1
  Program --> If1
  If1 --> Block1
  Block1 --> Statement2
  Block1 --> Statement2.5
  If1 --> Placeholder1
  Program --> Statement3
  `,
  `
  flowchart LR

  Program --> Statement1
  Statement1 --> If1
  If1 --> Block1
  Block1 --> Statement2
  Statement2 --> Statement2.5
  If1 --> Placeholder1
  Statement2.5 --> Statement3
  Placeholder1 --> Statement3
  `],
  ['program statements',`
    flowchart LR

    Program --> Statement1
    Program --> Statement2
    Program --> Statement3
  `, `
    flowchart LR

    Program --> Statement1
    Statement1 --> Statement2
    Statement2 --> Statement3
  `],
  ['tree to flow1', `
    flowchart LR

    Program --> If1
    If1 --> Block1
    Block1 --> Statement1
    Block1 --> Statement2
    If1 --> Placeholder1
  `, `
    flowchart LR
    
    Program --> If1
    If1 --> Block1
    Block1 --> Statement1
    If1 --> Placeholder1
    Statement1 --> Statement2
  `],

  ['tree to flow', `
    flowchart LR
  
    Program --> If1
    If1 --> Block1
    Block1 --> Statement1
    Block1 --> If2
    If2 --> Block2
    Block2 --> Statement2
    If2 --> Placeholder1
    Block1 --> If3
    If3 --> Block3
    Block3 --> Statement3
    If3 --> Placeholder2
  
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
  
    Program --> If1
    If1 --> Block1
    Block1 --> Statement1
    If2 --> Block2
    Block2 --> Statement2
    If2 --> Placeholder1
    If3 --> Block3
    Block3 --> Statement3
    If3 --> Placeholder2
    Statement1 --> If2
    Statement2 --> If3
    Placeholder1 --> If3
  
    subgraph 1
    Block2
    Statement2
    end
    subgraph 2
    Block3
    Statement3
    end
  `],

  ['tree to flow 2', `
    flowchart LR

    Program --> If1
    If1 --> Block1
    Block1 --> Statement1
    Block1 --> If2
    Block1 --> Statement1.5
    If2 --> Block2
    Block2 --> Statement2
    If2 --> Placeholder1
    Block1 --> If3
    If3 --> Block3
    Block3 --> Statement3
    If3 --> Placeholder2
    
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
    
    Program --> If1
    If1 --> Block1
    Block1 --> Statement1
    If2 --> Block2
    Block2 --> Statement2
    If2 --> Placeholder1
    If3 --> Block3
    Block3 --> Statement3
    If3 --> Placeholder2
    Statement1 --> If2
    Statement1.5 --> If3
    Statement2 --> Statement1.5
    Placeholder1 --> Statement1.5
    
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
    
    Program --> If1
    Program --> If2
    If1 --> Statement1
    If1 --> Placeholder1
  `, `
    flowchart LR
    
    Program --> If1
    If1 --> Statement1
    If1 --> Placeholder1
    Statement1 --> If2
    Placeholder1 --> If2
  `],
  ['a lot of Ifs', `
  flowchart LR

  ${new Array(numberOfIfs).fill(null).map((_, i) => `Program --> If${i}
  If${i} --> Block${i}
  If${i} --> Placeholder${i}`).join('\n')}
  `,`flowchart LR
  
  Program --> If0
  ${new Array(numberOfIfs - 1).fill(null).map((_, i) => `
    If${i} --> Block${i}
    If${i} --> Placeholder${i}
    Block${i} --> If${i+1}
    Placeholder${i} --> If${i+1}
  `.trim()).join('\n')}
  If${numberOfIfs - 1} --> Block${numberOfIfs - 1}
  If${numberOfIfs - 1} --> Placeholder${numberOfIfs - 1}
  `
],
['nested if', `
flowchart LR

If1 --> Block1
If1 --> Block2
If2 --> Block3
If2 --> Block4
Block1 --> If2
Block1 --> Statement1
Program --> If1
`, `
flowchart LR

If1 --> Block1
If1 --> Block2
If2 --> Block3
If2 --> Block4
Block1 --> If2
Program --> If1
Block3 --> Statement1
Block4 --> Statement1
`],
['trailing statement', `
flowchart LR
    
If1 --> Block1
If1 --> Block2
If2 --> Block3
If2 --> Block4
Program --> If1
Program --> If2
Program --> Statement1
`, `
flowchart LR
    
If1 --> Block1
If1 --> Block2
If2 --> Block3
If2 --> Block4
Program --> If1
Block1 --> If2
Block2 --> If2
Block3 --> Statement1
Block4 --> Statement1
`]
]

describe('tree to flow', () => {
  assets.forEach(([name, input, output]) => {
    it(name, async () => {
      const inputSanitized = sanitize(input)
      const expectedSanitized = sanitize(output)

      const data = getData(inputSanitized)
      const flow = treeToFlow(data)
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
      const flow = flowToTree(data)
      const result = stringifyChart(flow.connections, data.closures)

      console.log(result)

      expect(comparable(result)).toEqual(comparable(expectedSanitized))
    })
  })
})
