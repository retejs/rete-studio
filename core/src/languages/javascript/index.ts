
import { LanguageSnippet } from '..';

export { astTools, initCodePlugin } from './code-plugin'

export const name = 'JavaScript'

export const playgroundExample = `let count = 5;

while (count > 0) {
  log(count);
  count--;
}

log("Countdown complete!");
`

export const snippets: LanguageSnippet[] = [
  {
    label: 'Variable',
    code: `const name = '';`
  },
  {
    label: 'Assign',
    subitems: [
      {
        label: 'assign',
        code: `name = '';`
      },
      {
        label: 'increment',
        code: `i++`
      },
      {
        label: 'decrement',
        code: `i--`
      }
    ]
  },
  {
    label: 'Math',
    subitems: [
      {
        label: '+',
        code: `1 + 1`
      },
      {
        label: '-',
        code: `1 - 1`
      },
      {
        label: '*',
        code: `1 * 1`
      },
      {
        label: '/',
        code: `1 / 1`
      },
      {
        label: '%',
        code: `1 % 1`
      }
    ]
  },
  {
    label: 'Logical',
    subitems: [
      {
        label: 'equal',
        code: `1 == 1`
      },
      {
        label: 'not equal',
        code: `1 != 1`
      },
      {
        label: 'strict equal',
        code: `1 === 1`
      },
      {
        label: 'strict not equal',
        code: `1 !== 1`
      },
      {
        label: '>',
        code: `1 > 1`
      },
      {
        label: '>=',
        code: `1 >= 1`
      },
      {
        label: '<',
        code: `1 < 1`
      },
      {
        label: '<=',
        code: `1 <= 1`
      },
      {
        label: 'and',
        code: `true && true`
      },
      {
        label: 'or',
        code: `true || true`
      },
      {
        label: 'not',
        code: `!true`
      }
    ]
  },
  {
    label: 'Operators',
    subitems: [
      {
        label: 'typeof',
        code: `typeof 1`
      },
      {
        label: 'instanceof',
        code: `1 instanceof Number`
      },
      {
        label: 'in',
        code: `0 in [0]`
      },
      {
        label: 'delete',
        code: `delete obj.prop`
      }
    ]
  },
  {
    label: 'Function',
    subitems: [
      {
        label: 'function',
        code: `function func() {}`
      },
      {
        label: 'return',
        code: `return 1`
      }
    ]
  },
  {
    label: 'If',
    code: `if (true) {}`
  },
  {
    label: 'Array',
    code: `[1]`
  },
  {
    label: 'Object',
    code: `({ a: 1 })`
  },
  {
    label: 'Class',
    code: `class Class {
      constructor() {}
    }`
  },
  {
    label: 'Modules',
    subitems: [
      {
        label: 'Import',
        code: `import { n } from ''`
      },
      {
        label: 'Export',
        code: `export { n }`
      },
    ]
  },
  {
    label: 'Try-catch',
    code: `try {} catch (e) {}`
  },
  {
    label: 'Log',
    code: `console.log()`
  },
]
