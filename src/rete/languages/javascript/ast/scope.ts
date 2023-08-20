import * as BabelType from '@babel/types'

const scopeHoisingIndex = new WeakMap()

export function hoise(scopable: BabelType.Scopable, declaration: BabelType.Declaration) {
  const parentBody = getScopableBody(scopable)
  const index = scopeHoisingIndex.get(parentBody) || 0

  parentBody.splice(index, 0, declaration)
  scopeHoisingIndex.set(parentBody, index + 1)
}

export function getScopableBody(scopable: BabelType.Scopable) {
  if (BabelType.isSwitchStatement(scopable)) throw new Error('scope does not have body')
  if (!Array.isArray(scopable.body)) throw new Error('not implemented for non-array body')

  return scopable.body
}

export function prepend(parent: BabelType.Scopable, node: BabelType.Statement, nextSibling: BabelType.Statement) {
  const body = getScopableBody(parent)

  const exportIndex = body.indexOf(nextSibling)

  if (exportIndex < 0) throw new Error('exportIndex is negative')

  body.splice(exportIndex, 0, node)
}
