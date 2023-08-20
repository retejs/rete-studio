import * as BabelType from '@babel/types'
import { Scope as TraverseScope } from '@babel/traverse'

export function declarationToVariable(
  declaration: BabelType.Declaration,
  transformBody: (body: BabelType.Node, parentScope: TraverseScope) => void,
  parentScope: TraverseScope
) {
  if (BabelType.isVariableDeclaration(declaration)) {
    return declaration
  }
  if (BabelType.isFunctionDeclaration(declaration)) {
    if (!declaration.id) throw new Error('function declaration should have id')

    return BabelType.variableDeclaration('var', [
      BabelType.variableDeclarator(declaration.id, declarationToExpression(declaration, transformBody, parentScope))
    ])
  }
  if (BabelType.isClassDeclaration(declaration)) {
    return BabelType.variableDeclaration('const', [
      BabelType.variableDeclarator(declaration.id, declarationToExpression(declaration, transformBody, parentScope))
    ])
  }
  throw new Error('unknown declaration type')
}

export function declarationToExpression(
  declaration: BabelType.Declaration,
  transformBody: (body: BabelType.Node, parentScope: TraverseScope) => void,
  parentScope: TraverseScope
) {
  if (BabelType.isFunctionDeclaration(declaration)) {
    const { id, params, body, generator, async } = declaration

    transformBody(body, parentScope)

    return BabelType.functionExpression(id, params, body, generator, async)
  }
  if (BabelType.isClassDeclaration(declaration)) {
    transformBody(declaration, parentScope)

    const { id, superClass, body, decorators } = declaration

    return BabelType.classExpression(id, superClass, body, decorators)
  }
  throw new Error('unknown declaration type')
}
