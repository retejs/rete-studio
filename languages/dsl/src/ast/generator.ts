import * as AST from './types'

// Generate DSL code from AST
export function generate(node: AST.DSLNode): string {
  return generateNode(node)
}

function generateNode(node: AST.DSLNode, indent = 0): string {
  switch (node.type) {
  case 'Program':
    return generateProgram(node, indent)
  case 'VarDeclaration':
    return generateVarDeclaration(node, indent)
  case 'IfStatement':
    return generateIfStatement(node, indent)
  case 'Block':
    return generateBlock(node, indent)
  case 'ExpressionStatement':
    return generateExpressionStatement(node, indent)
  case 'BinaryExpression':
    return generateBinaryExpression(node)
  case 'ParenExpression':
    return `(${generateNode(node.expression)})`
  case 'Identifier':
    return node.name
  case 'NumberLiteral':
    return String(node.value)
  default:
    throw new Error(`Unknown node type: ${(node as any).type}`) // eslint-disable-line @typescript-eslint/no-explicit-any
  }
}

function generateProgram(node: AST.Program, _indent: number): string {
  return node.body.map(stmt => generateNode(stmt, 0)).join('\n')
}

function generateVarDeclaration(node: AST.VarDeclaration, indent: number): string {
  const indentStr = '  '.repeat(indent)

  return `${indentStr}let ${node.id.name} = ${generateNode(node.init)}`
}

function generateIfStatement(node: AST.IfStatement, indent: number): string {
  const indentStr = '  '.repeat(indent)
  let result = `${indentStr}if (${generateNode(node.test)}) ${generateNode(node.consequent, indent)}`

  if (node.alternate) {
    if (node.alternate.type === 'IfStatement') {
      // else if
      const elseIfPart = generateIfStatement(node.alternate, indent)

      result += ` else ${elseIfPart.trim()}`
    } else {
      // else
      result += ` else ${generateNode(node.alternate, indent)}`
    }
  }

  return result
}

function generateBlock(node: AST.Block, indent: number): string {
  const indentStr = '  '.repeat(indent)
  const body = node.body.map(stmt => generateNode(stmt, indent + 1)).join('\n')

  if (body) {
    return `{\n${body}\n${indentStr}}`
  }

  return '{}'
}

function generateExpressionStatement(node: AST.ExpressionStatement, indent: number): string {
  const indentStr = '  '.repeat(indent)

  return `${indentStr}${generateNode(node.expression)}`
}

function generateBinaryExpression(node: AST.BinaryExpression): string {
  const left = generateNode(node.left)
  const right = generateNode(node.right)

  return `${left} ${node.operator} ${right}`
}
