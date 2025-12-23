import type { LanguageSnippet } from 'rete-studio-core'

import { astTools, initCodePlugin } from './code-plugin'

export const name = 'DSL'

export const playgroundExample = `let x = 10
let y = 20
let sum = x + y

if (sum > 25) {
  let result = sum * 2
} else if (sum > 15) {
  let result = sum + 5
} else {
  let result = sum
}`

export const snippets: LanguageSnippet[] = [
  {
    label: 'Variable declaration',
    code: 'let x = 0'
  },
  {
    label: 'Addition',
    code: 'x + y'
  },
  {
    label: 'Subtraction',
    code: 'x - y'
  },
  {
    label: 'Multiplication',
    code: 'x * y'
  },
  {
    label: 'Division',
    code: 'x / y'
  },
  {
    label: 'Greater than',
    code: 'x > y'
  },
  {
    label: 'Less than',
    code: 'x < y'
  },
  {
    label: 'Greater or equal',
    code: 'x >= y'
  },
  {
    label: 'Less or equal',
    code: 'x <= y'
  },
  {
    label: 'Equal',
    code: 'x == y'
  },
  {
    label: 'Not equal',
    code: 'x != y'
  },
  {
    label: 'If statement',
    code: `if (x > 0) {
  let y = x
}`
  },
  {
    label: 'If-else statement',
    code: `if (x > 0) {
  let y = x
} else {
  let y = 0
}`
  },
  {
    label: 'If-else if-else statement',
    code: `if (x > 0) {
  let y = 1
} else if (x < 0) {
  let y = -1
} else {
  let y = 0
}`
  },
  {
    label: 'Parentheses',
    code: '(x + y) * 2'
  },
  {
    label: 'Number',
    code: '42'
  },
  {
    label: 'Identifier',
    code: 'x'
  }
]

export { astTools, initCodePlugin }
