/* eslint-disable @typescript-eslint/no-var-requires */
const { readdirSync, readFileSync, statSync } = require('fs')
const { join, relative } = require('path')
const { flatExamples } = require('../../utils')

function readFilesRecursively(dir) {
  const items = readdirSync(dir)
  const result = []

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

function loadExamples() {
  return readFilesRecursively(examplesDir)
}

function loadExamplesList() {
  const files = readFilesRecursively(examplesDir)

  return flatExamples(files)
}

module.exports = {
  readFilesRecursively,
  loadExamples,
  loadExamplesList,
}
