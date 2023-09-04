import traverse from '@babel/traverse';
import { Languages } from 'rete-studio-core'
import { File, Folder } from '../_utils';

const astTools = Languages.javascript.astTools

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

function f(items: (File | Folder)[]): (File | Folder)[] {
  return items.map(item => {
    if ('children' in item) return { ...item, children: f(item.children) }
    return { ...item, labels: getLabels(item.input) }
  })
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const examples = f(JSON.parse(process.env.JS_EXAMPLES) as (File | Folder)[])
