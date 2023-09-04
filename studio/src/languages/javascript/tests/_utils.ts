import { readdirSync, readFileSync, statSync } from 'fs'
import { join, relative } from 'path'
import { File, flatExamples, Folder } from '../../_utils'

export function readFilesRecursively(dir: string) {
  const items = readdirSync(dir)
  const result: (File | Folder)[] = []

  for (const item of items) {
    const fullPath = join(dir, item)
    const stats = statSync(fullPath)

    if (stats.isDirectory()) {
      result.push({
        name: item,
        children: readFilesRecursively(fullPath)
      })
    } else {
      if (!fullPath.endsWith('.out')) result.push({
        name: item,
        path: relative(examplesDir, fullPath),
        input: readFileSync(fullPath, { encoding: 'utf-8' }),
        output: readFileSync(`${fullPath}.out`, { encoding: 'utf-8' })
      })
    }
  }
  result.sort((a, b) => {
    if ('children' in a && 'children' in b) return 0
    if ('children' in a) return -1
    if ('children' in b) return 1
    return 0
  })
  return result
}

const examplesDir = join(__dirname, '../examples')

export function loadExamples() {
  return readFilesRecursively(examplesDir)
}

export function loadExamplesList() {
  const files = readFilesRecursively(examplesDir)

  return flatExamples(files)
}
