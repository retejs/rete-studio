import traverse, { NodePath } from '@babel/traverse'
import * as BabelType from '@babel/types'
import * as t from '@babel/types'
import { getUID } from 'rete'

export function createLoop(path: NodePath<BabelType.Statement>) {
  const id = path.parentPath.isLabeledStatement() ? path.parentPath.node.label : t.identifier('loop' + getUID())

  if (path.parentPath.isLabeledStatement()) {
    path.parentPath.node.label = t.identifier('old' + getUID())
  }

  return {
    id,
    statement: t.labeledStatement(id, t.emptyStatement()),
    patchContinue(body: BabelType.Statement, pregoto?: BabelType.Statement | null) {
      traverse(body, {
        enter(path) {
          if (path.isCompletionStatement()) {
            path.skip()
          }
          if (path.isContinueStatement()) {
            if (!path.node.label || path.node.label.name === id.name) {
              const n = t.continueStatement(id)

              path.replaceWith(t.blockStatement(pregoto ? [pregoto, n] : [n]))
              path.skip()
            }
          }
        }
      }, path.scope)
    }
  }
}

export function loopToGoto(path: NodePath<BabelType.WhileStatement | BabelType.ForStatement>, pregoto?: BabelType.Statement | null) {
  const { test, body } = path.node
  const { id, statement, patchContinue } = createLoop(path)
  const block = t.blockStatement([])

  const ifStatement = t.ifStatement(test || t.booleanLiteral(true), block)

  statement.body = ifStatement

  patchContinue(body, pregoto)

  if (t.isBlockStatement(body)) {
    block.body.push(...body.body)
  } else {
    block.body.push(body)
  }
  if (pregoto) {
    block.body.push(pregoto)
  }
  block.body.push(t.continueStatement(id))

  return {
    statement,
    id,
    body: block
  }
}
