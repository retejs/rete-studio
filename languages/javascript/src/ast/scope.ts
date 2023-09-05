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

export function prepend(parent: BabelType.Node, node: BabelType.Statement, nextSibling: BabelType.Statement) {
  return insert(parent, node, nextSibling, 0)
}

export function append(parent: BabelType.Node, node: BabelType.Statement, nextSibling: BabelType.Statement) {
  return insert(parent, node, nextSibling, 1)
}

function insert(parent: BabelType.Node, node: BabelType.Statement, nextSibling: BabelType.Statement, index: number) {
  const scope = BabelType.isLabeledStatement(parent) ? parent.body : parent

  if (!BabelType.isScopable(scope)) throw new Error('parent is not scopable')
  const body = getScopableBody(scope)

  const exportIndex = body.indexOf(nextSibling)

  if (exportIndex < 0) throw new Error('exportIndex is negative')

  body.splice(exportIndex + index, 0, node)
}
