import { AbstractParseTreeVisitor } from 'antlr4ts/tree/AbstractParseTreeVisitor'

import {
  AddSubExprContext,
  BlockContext,
  ComparisonExprContext,
  ElseClauseContext,
  ElseIfClauseContext,
  ExpressionStatementContext,
  IfStatementContext,
  MulDivExprContext,
  ParenExprContext,
  PrimaryContext,
  PrimaryExprContext,
  ProgramContext,
  StatementContext,
  VarDeclarationContext } from '../generated/antlr4/DSLParser'
import { DSLVisitor } from '../generated/antlr4/DSLVisitor'
import * as AST from './types'

export class ASTBuilder extends AbstractParseTreeVisitor<AST.DSLNode> implements DSLVisitor<AST.DSLNode> {
  protected defaultResult(): AST.DSLNode {
    throw new Error('Unsupported node type')
  }

  visitProgram(ctx: ProgramContext): AST.Program {
    const body: AST.Statement[] = []

    for (let i = 0; i < ctx.childCount; i++) {
      const child = ctx.getChild(i)

      if (child instanceof StatementContext) {
        body.push(this.visit(child) as AST.Statement)
      }
    }
    return {
      type: 'Program',
      body
    }
  }

  visitStatement(ctx: StatementContext): AST.Statement {
    return this.visit(ctx.getChild(0)) as AST.Statement
  }

  visitVarDeclaration(ctx: VarDeclarationContext): AST.VarDeclaration {
    const id = ctx.ID()
    const init = this.visit(ctx.expression()) as AST.Expression

    return {
      type: 'VarDeclaration',
      id: {
        type: 'Identifier',
        name: id.text
      },
      init
    }
  }

  visitIfStatement(ctx: IfStatementContext): AST.IfStatement {
    const test = this.visit(ctx.expression()) as AST.Expression
    const consequent = this.visit(ctx.block()) as AST.Block

    let alternate: AST.IfStatement | AST.Block | undefined

    // Check for else if clauses
    const elseIfClauses = ctx.elseIfClause()
    const elseClause = ctx.elseClause()

    if (elseIfClauses.length > 0) {
      // Build chain of if statements from else-if clauses
      alternate = this.buildElseIfChain(elseIfClauses, elseClause)
    } else if (elseClause) {
      alternate = this.visit(elseClause) as AST.Block
    }

    return {
      type: 'IfStatement',
      test,
      consequent,
      alternate
    }
  }

  private buildElseIfChain(
    elseIfClauses: ElseIfClauseContext[],
    elseClause: ElseClauseContext | undefined
  ): AST.IfStatement {
    // Build from the last else-if backwards
    let current: AST.IfStatement | AST.Block | undefined

    if (elseClause) {
      current = this.visit(elseClause) as AST.Block
    }

    // Build chain from last to first
    for (let i = elseIfClauses.length - 1; i >= 0; i--) {
      const elseIf = elseIfClauses[i]
      const test = this.visit(elseIf.expression()) as AST.Expression
      const consequent = this.visit(elseIf.block()) as AST.Block

      current = {
        type: 'IfStatement',
        test,
        consequent,
        alternate: current
      }
    }

    return current as AST.IfStatement
  }

  visitElseClause(ctx: ElseClauseContext): AST.Block {
    return this.visit(ctx.block()) as AST.Block
  }

  visitBlock(ctx: BlockContext): AST.Block {
    const body: AST.Statement[] = []

    for (let i = 0; i < ctx.childCount; i++) {
      const child = ctx.getChild(i)

      if (child instanceof StatementContext) {
        body.push(this.visit(child) as AST.Statement)
      }
    }
    return {
      type: 'Block',
      body
    }
  }

  visitExpressionStatement(ctx: ExpressionStatementContext): AST.ExpressionStatement {
    return {
      type: 'ExpressionStatement',
      expression: this.visit(ctx.expression()) as AST.Expression
    }
  }

  visitPrimaryExpr(ctx: PrimaryExprContext): AST.Expression {
    return this.visit(ctx.primary()) as AST.Expression
  }

  visitParenExpr(ctx: ParenExprContext): AST.ParenExpression {
    return {
      type: 'ParenExpression',
      expression: this.visit(ctx.expression()) as AST.Expression
    }
  }

  visitMulDivExpr(ctx: MulDivExprContext): AST.BinaryExpression {
    const left = this.visit(ctx.expression(0)) as AST.Expression
    const right = this.visit(ctx.expression(1)) as AST.Expression
    const operator = ctx.getChild(1).text as '*' | '/'

    return {
      type: 'BinaryExpression',
      operator,
      left,
      right
    }
  }

  visitAddSubExpr(ctx: AddSubExprContext): AST.BinaryExpression {
    const left = this.visit(ctx.expression(0)) as AST.Expression
    const right = this.visit(ctx.expression(1)) as AST.Expression
    const operator = ctx.getChild(1).text as '+' | '-'

    return {
      type: 'BinaryExpression',
      operator,
      left,
      right
    }
  }

  visitComparisonExpr(ctx: ComparisonExprContext): AST.BinaryExpression {
    const left = this.visit(ctx.expression(0)) as AST.Expression
    const right = this.visit(ctx.expression(1)) as AST.Expression
    const operator = ctx.getChild(1).text as '>' | '<' | '>=' | '<=' | '==' | '!='

    return {
      type: 'BinaryExpression',
      operator,
      left,
      right
    }
  }

  visitPrimary(ctx: PrimaryContext): AST.Expression {
    if (ctx.ID()) {
      return {
        type: 'Identifier',
        name: ctx.ID()!.text
      }
    } else if (ctx.NUMBER()) {
      return {
        type: 'NumberLiteral',
        value: parseFloat(ctx.NUMBER()!.text)
      }
    }
    throw new Error('Unknown primary expression')
  }
}
