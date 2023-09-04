import * as BabelType from '@babel/types'
import * as t from '@babel/types'
import traverse, { Scope as TraverseScope } from '@babel/traverse'
import { getIdentifiers } from './utils'
import { append, hoise, prepend } from './scope'
import { declarationToExpression, declarationToVariable } from './declarations'
import { createLoop, loopToGoto } from './loop'

export function makePurifiedExecutable<T extends BabelType.Node>(node: T, scope?: TraverseScope): T {
  traverse(node, {
    enter(path) {
      if (path.isLabeledStatement()) {
        const { label, body } = path.node

        makePurifiedExecutable(body, path.scope)

        path.replaceWith(t.labeledStatement(label, t.whileStatement(t.booleanLiteral(true), t.blockStatement([
          body,
          t.breakStatement(label)
        ]))))
        path.skip()
      }
    }
  }, scope)
  return node
}

export function applyAstTransformations<T extends BabelType.Node>(node: T, scope?: TraverseScope): T {
  traverse(node, {
    enter(path) {
      if (path.isObjectProperty()) {
        if (!path.node.computed && t.isIdentifier(path.node.key)) {
          path.replaceWith(t.objectProperty(t.stringLiteral(path.node.key.name), path.node.value, true, path.node.shorthand, path.node.decorators))
        }
      }
      if (path.isMemberExpression()) {
        if (!path.node.computed && t.isIdentifier(path.node.property)) {
          path.replaceWith(t.memberExpression(path.node.object, t.stringLiteral(path.node.property.name), true, path.node.optional))
        }
      }
      if (path.isWhileStatement()) {
        const { statement } = loopToGoto(path)

        path.replaceWith(statement)
      }
      if (path.isForStatement()) {
        const { init, update } = path.node;
        const { statement } = loopToGoto(path, update && t.expressionStatement(update))

        const closure = t.blockStatement([statement])

        if (init) {
          closure.body.unshift(t.isStatement(init) ? init : t.expressionStatement(init))
        }

        path.replaceWith(closure);
      }
      if (path.isDoWhileStatement()) {
        const { test, body } = path.node;
        const { id, statement, patchContinue } = createLoop(path)
        const block = t.blockStatement([])

        patchContinue(body)
        statement.body = block

        if (t.isBlockStatement(body)) {
          block.body.push(...body.body);
        } else {
          block.body.push(body)
        }

        const ifStatement = t.ifStatement(test || t.booleanLiteral(true), t.continueStatement(id))

        block.body.push(ifStatement)

        path.replaceWith(statement);
      }
      if (path.isForInStatement() || path.isForOfStatement()) {
        const { left, right, body } = path.node;
        const { id, statement, patchContinue } = createLoop(path)
        const closure = t.blockStatement([statement])

        const iteratorId = t.identifier('iterator')
        const iterator = t.memberExpression(right, t.memberExpression(t.identifier('Symbol'), t.identifier('iterator')), true)

        closure.body.unshift(t.variableDeclaration('const', [
          t.variableDeclarator(iteratorId, t.callExpression(iterator, []))
        ]))

        const block = t.blockStatement([])

        patchContinue(body)
        statement.body = block

        block.body.push(t.variableDeclaration('const', [
          t.variableDeclarator(t.objectPattern([
            t.objectProperty(t.identifier('value'), t.identifier('value')),
            t.objectProperty(t.identifier('done'), t.identifier('done'))
          ]), t.callExpression(t.memberExpression(iteratorId, t.identifier('next')), [])
          )]))
        block.body.push(t.ifStatement(t.identifier('done'), t.breakStatement(id)))

        if (t.isVariableDeclaration(left)) {
          left.declarations[0].init = right
          block.body.push(left)
        } else {
          block.body.push(t.variableDeclaration('const', [
            t.variableDeclarator(left, t.identifier('value'))
          ]))
        }

        if (t.isBlockStatement(body)) {
          block.body.push(...body.body);
        } else {
          block.body.push(body)
        }

        block.body.push(t.continueStatement(id))
        path.replaceWith(closure);
      }
      if (path.isSwitchStatement()) {
        const { discriminant, cases } = path.node;
        const { statement } = createLoop(path)

        const block = t.blockStatement([])

        statement.body = block

        const v = t.variableDeclaration('let', [
          t.variableDeclarator(t.identifier('_switchCase'))
        ])
        block.body.push(v)
        cases.forEach(item => {
          const completed = t.assignmentExpression('=', t.identifier('_switchCase'), t.booleanLiteral(true))
          const test = item.test && t.binaryExpression('===', discriminant, item.test)
          const testAll = test && t.logicalExpression('||', t.identifier('_switchCase'), test)

          block.body.push(testAll ? t.ifStatement(testAll, t.blockStatement([
            ...item.consequent,
            t.expressionStatement(completed)
          ])) : t.blockStatement(item.consequent))
        })

        path.replaceWith(statement)
      }
      if (path.isExportNamedDeclaration() && path.node.declaration) {
        if (!BabelType.isScopable(path.parent)) throw new Error('parent is not scopable')

        const { declaration } = path.node

        path.node.declaration = null

        const varDeclaration = declarationToVariable(declaration, applyAstTransformations, path.parentPath.scope)

        prepend(path.parent, varDeclaration, path.node)

        const declarations = varDeclaration.declarations.map(item => getIdentifiers(item.id)).flat()

        for (const id of declarations) {
          path.node.specifiers.push(BabelType.exportSpecifier(id, id))
        }
      } else if (path.isExportDefaultDeclaration() && path.node.declaration) {

        if (BabelType.isDeclaration(path.node.declaration)) {
          path.node.declaration = declarationToExpression(path.node.declaration, applyAstTransformations, path.parentPath.scope)
        }
      } else if (path.isImportDefaultSpecifier()) {
        path.replaceWith(BabelType.importSpecifier(path.node.local, BabelType.identifier('default')))
      } else if (path.isFunctionDeclaration()) {
        if (path.node.id && ('body' in path.parent)) {
          const variable = declarationToVariable(path.node, applyAstTransformations, path.parentPath.scope)
          path.remove()

          if (!BabelType.isScopable(path.parent)) throw new Error('parent is not scopable')
          hoise(path.parent, variable)
        }
      } else if (path.isClassDeclaration()) {
        path.replaceWith(declarationToVariable(path.node, applyAstTransformations, path.parentPath.scope))
      } else if (path.isObjectMethod()) {
        const { params, body, generator, async } = path.node
        const functionExpression = BabelType.functionExpression(null, params, body, generator, async)

        path.replaceWith(BabelType.objectProperty(path.node.key, functionExpression))
      } else if (path.isArrowFunctionExpression() && BabelType.isExpression(path.node.body)) {
        path.node.body = BabelType.blockStatement([BabelType.returnStatement(path.node.body)])
      } else if (path.isClassMethod() && BabelType.isIdentifier(path.node.key) && path.node.key.name !== 'constructor') {
        const params = path.node.params.filter((p): p is Exclude<typeof p, BabelType.TSParameterProperty> => !BabelType.isTSParameterProperty(p))
        const functionExpression = BabelType.functionExpression(null, params, path.node.body)

        const parent = path.parentPath
        if (!parent.isClassBody()) throw new Error('parent is not class body')

        parent.node.body.unshift(BabelType.classProperty(path.node.key, functionExpression))
        path.remove()
      }
    }
  }, scope)
  return node
}

function omitBlockStatements(node: BabelType.Node, scope?: TraverseScope) {
  traverse(node, {
    enter(path) {
      if (path.isBlockStatement() && path.parentPath.isScopable()) {
        if (path.node.body.length > 0 && !path.node.body.some(item => t.isVariableDeclaration(item))) {
          const create = path.parentPath.isBlockStatement() ? t.blockStatement : t.program
          if (path.parentPath.isBlockStatement() || path.parentPath.isProgram()) {
            const body = path.parentPath.node.body.map(item => {
              return item === path.node ? path.node.body : item
            }).flat()

            path.parentPath.replaceWith(create(body))
          }
        }
      }
      if (path.isIfStatement()) {
        if (t.isBlockStatement(path.node.consequent) && path.node.consequent.body.length === 1 && !t.isVariableDeclaration(path.node.consequent.body[0])) {
          path.replaceWith(t.ifStatement(path.node.test, path.node.consequent.body[0], path.node.alternate))
        }
        if (t.isBlockStatement(path.node.alternate) && path.node.alternate.body.length === 1 && !t.isVariableDeclaration(path.node.alternate.body[0])) {
          path.replaceWith(t.ifStatement(path.node.test, path.node.consequent, path.node.alternate.body[0]))
        }
      }
      if (path.isBlockStatement() && path.parentPath.isLabeledStatement() && path.node.body.length === 1 && !t.isVariableDeclaration(path.node.body[0])) {
        path.parentPath.replaceWith(t.labeledStatement(path.parentPath.node.label, path.node.body[0]))
      }
      // if (path.isBlockStatement() && path.parentPath.isProgram()) {
      //   if (path.parentPath.node.body.length === 1) {
      //     path.replaceWith(t.program(path.node))
      //   }
      // }
    }
  }, scope)
}

export function applyAstReverseTransformations<T extends BabelType.Node>(node: T, scope?: TraverseScope): T {
  const n = BabelType.isProgram(node) ? BabelType.file(node) : node

  traverse(n, {
    enter(path) {
      if (path.isObjectProperty()) {
        if (path.node.computed && t.isStringLiteral(path.node.key)) {
          path.replaceWith(t.objectProperty(t.identifier(path.node.key.value), path.node.value, false, path.node.shorthand, path.node.decorators))
        }
      }
      if (path.isMemberExpression()) {
        if (path.node.computed && t.isStringLiteral(path.node.property)) {
          path.replaceWith(t.memberExpression(path.node.object, t.identifier(path.node.property.value), false, path.node.optional))
        }
      }
    }
  }, scope)

  omitBlockStatements(n, scope)

  // omit else after trailing break/continue
  traverse(n, {
    enter(path) {
      if (path.isIfStatement()) {
        const { test, consequent, alternate } = path.node
        const lastConsequentStatement = getLast(consequent)

        if (alternate && (t.isBreakStatement(lastConsequentStatement) || t.isContinueStatement(lastConsequentStatement))) {

          if (t.isIfStatement(path.parent) && path.key === 'consequent') {
            path.parentPath.replaceWith(t.ifStatement(path.parent.test, t.blockStatement([path.node]), path.parent.alternate))
          }

          path.insertAfter(alternate)
          path.replaceWith(t.ifStatement(test, consequent))
        }
      }
    }
  }, scope)

  omitBlockStatements(n, scope)

  // do while
  traverse(n, {
    enter(path) {
      if (path.isLabeledStatement()) {
        const body = path.node.body

        if (t.isBlockStatement(body)) {
          const last = body.body[body.body.length - 1]

          if (t.isIfStatement(last)) {
            if (t.isContinueStatement(last.consequent) && (!last.alternate || t.isBreakStatement(last.alternate))) {
              if (last.consequent.label?.name === path.node.label.name) {
                path.replaceWith(t.labeledStatement(path.node.label,
                  t.doWhileStatement(last.test, t.blockStatement(body.body.slice(0, body.body.length - 1)))
                ))
              }
            }
          }
        }
      }
    }
  }, scope)

  traverse(n, {
    enter(path) {
      if (path.isLabeledStatement()) {
        const body = path.node.body

        if (t.isIfStatement(body)) {
          const last = getLast(body.consequent)

          if (t.isContinueStatement(last) && last.label?.name === path.node.label.name) {
            path.replaceWith(t.labeledStatement(path.node.label,
              t.whileStatement(body.test, body.consequent)
            ))
            if (body.alternate) append(path.parent, body.alternate, path.node)
          }
        }
      }
    }
  }, scope)


  // remove redundant continue statements
  traverse(n, {
    enter(path) {
      if (path.isWhileStatement() && t.isLabeledStatement(path.parent)) {
        const last = getLast(path.node.body)

        if (t.isContinueStatement(last) && path.parent.label.name === last.label?.name) {
          path.traverse({
            enter: continuePath => {
              if (continuePath.node === last) continuePath.remove()
            }
          })
        }
      }
    }
  }, scope)

  // remove unused labels
  traverse(n, {
    enter(path) {
      if (path.isLabeledStatement()) {
        let used = false

        path.traverse({
          enter(nestedPath) {
            if (nestedPath.isBreakStatement() || nestedPath.isContinueStatement()) {
              if (nestedPath.node.label?.name === path.node.label.name) {
                used = true
              }
            }
          }
        })
        if (!used) path.replaceWith(path.node.body)
      }
    }
  }, scope)

  return n as T
}


function getLast(statement: BabelType.Statement): BabelType.Statement {
  if (t.isBlockStatement(statement)) {
    return getLast(statement.body[statement.body.length - 1])
  }
  return statement
}
