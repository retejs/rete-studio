// @ts-nocheck
import { ASTNodeBase, Context, mirrorLeft, mirrorRight, Schemes, ToASTContext } from 'rete-studio-core'

import { Transformer } from './interface'

export class MirrorDataflowExpressions<ASTNode extends ASTNodeBase, S extends Schemes> extends Transformer<Context<ASTNode, S>, ToASTContext<ASTNode, S>> {
  constructor() {
    super('Mirror dataflow expressions')
  }

  async up(context: Context<ASTNode, S>) {
    await (mirrorRight<ASTNode, S>(
      ({ label }, key) => {
        return (['IfStatement'].includes(label) && /^test$/.test(key))
          || (['ExpressionStatement'].includes(label) && /^expression$/.test(key))
          || (['VariableDeclarator'].includes(label) && /^(init)$/.test(key))
          || (['ThrowStatement'].includes(label) && /^argument$/.test(key))
          || (['ImportDeclaration'].includes(label) && /^(source)$/.test(key))
          || (['ImportSpecifier'].includes(label) && /^(imported)$/.test(key))
          || (['ExportNamedDeclaration'].includes(label) && /^specifiers\[.*\]$/.test(key))
          || (['ExportDefaultDeclaration'].includes(label) && /^declaration$/.test(key))
          || (['ObjectProperty'].includes(label) && /^key$/.test(key))
          || (['ReturnStatement'].includes(label) && /^argument$/.test(key))
          || (['AssignmentPattern'].includes(label) && /^right$/.test(key))
          || (['ClassExpression'].includes(label) && /^superClass$/.test(key))
          || (['ClassBody'].includes(label) && /^body\[.*\]$/.test(key))
      },
      (node, key, side) => node.label === 'ObjectProperty' && side === 'input' && key === 'key'
    ))(context)
  }

  async down(context: ToASTContext<ASTNode, S>): Promise<void> {
    // Mirror expressions
    await (mirrorLeft<ASTNode, S>(
      ({ label }, key) => { // TODO reusable
        return (['IfStatement'].includes(label) && /^test$/.test(key))
          || (['ExpressionStatement'].includes(label) && /^expression$/.test(key))
          || (['VariableDeclarator'].includes(label) && /^(init)$/.test(key))
          || (['ThrowStatement'].includes(label) && /^argument$/.test(key))
          || (['ImportDeclaration'].includes(label) && /^(source)$/.test(key))
          || (['ImportSpecifier'].includes(label) && /^(imported)$/.test(key))
          || (['ExportNamedDeclaration'].includes(label) && /^specifiers\[.*\]$/.test(key))
          || (['ExportDefaultDeclaration'].includes(label) && /^declaration$/.test(key))
          || (['ObjectProperty'].includes(label) && /^key$/.test(key))
          || (['ReturnStatement'].includes(label) && /^argument$/.test(key))
          || (['AssignmentPattern'].includes(label) && /^right$/.test(key))
          || (['ClassExpression'].includes(label) && /^superClass$/.test(key))
          || (['ClassBody'].includes(label) && /^body\[.*\]$/.test(key))
      },
      (node, key, side) => node.label === 'ObjectProperty' && side === 'input'/* TODO output ?? */ && key === 'key'
    ))(context)
  }
}
