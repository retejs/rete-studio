export type TreeNode = File | Folder

export type File = { name: string, path: string, input: string, output: string, labels?: string[] }
export type Folder = { name: string, children: (File | Folder)[] }

export function flatExamples(examples: (File | Folder)[], path = ''): File[] {
  return examples.reduce((examples, example) => {
    if ('children' in example) return [...examples, ...flatExamples(example.children, [path, example.name].join('/'))]

    return [...examples, example]
  }, [] as File[])
}
