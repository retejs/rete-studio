import traverse from '@babel/traverse';
import { astTools } from './code-plugin';
import { File, Folder } from '../_utils';
import { LanguageSnippet } from '..';

export { astTools, initCodePlugin } from './code-plugin'

export const name = 'JavaScript'

function f(items: (File | Folder)[]): (File | Folder)[] {
  return items.map(item => {
    if ('children' in item) return { ...item, children: f(item.children) }
    return { ...item, labels: getLabels(item.input) }
  })
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const examples = f(JSON.parse(process.env.JS_EXAMPLES) as (File | Folder)[])

function getLabels(code: string) {
  const ast = astTools.parse(code)
  const nodeTypes = new Set<string>();

  traverse(ast, {
    enter(path) {
      nodeTypes.add(path.node.type);
    },
  });

  return Array.from(nodeTypes)
}

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
