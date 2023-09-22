import { NodeId } from 'rete'
import {
  ASTNodeBase, BaseNode, BIND_KEY, Connection,
  Context, InputControl, InputType, Schemes, simplifyLiterals, ToASTContext
} from 'rete-studio-core'

import { Transformer } from './interface'

export class LiteralsToControls<ASTNode extends ASTNodeBase, S extends Schemes> extends Transformer<Context<ASTNode, S>, ToASTContext<ASTNode, S>> {
  types: Record<string, [InputType, unknown]> = {
    'StringLiteral': ['text', ''],
    'NumericLiteral': ['number', 0],
    'BooleanLiteral': ['boolean', false],
    'NullLiteral': ['null', null]
    // 'BigIntLiteral': ['bigint', 0n] // TODO
  }

  constructor() {
    super('literals to controls')
  }

  literalToType(label: string): InputType {
    return this.types[label][0]
  }

  async up(context: Context<ASTNode, S>) {
    // simplify literals into input controls
    await (simplifyLiterals<S>(node => {
      const literals = ['StringLiteral', 'NumericLiteral', 'NullLiteral', 'DecimalLiteral', 'BooleanLiteral', 'BigIntLiteral']

      return [...literals, 'Identifier'].includes(node.label)
    }, node => {
      if (node.label === 'Identifier') {
        return new InputControl({ action: 'change-identifier', type: 'identifier', initial: String(node.data.name) })
      }
      const type = this.literalToType(node.label)
      const control = new InputControl({ action: 'change-literal', type, readonly: false })

      control.setValue(node.data.value)

      return control
    }))(context)
  }

  typeToLiteral(type: InputType): [string, unknown] {
    const literal = Object.entries(this.types).find(([_, t]) => t[0] === type)

    if (!literal) throw new Error(`Unknown type ${type}`)

    return [literal[0], literal[1][1]]
  }

  async down(context: ToASTContext<ASTNode, S>): Promise<void> {
    // restore literals from input controls
    await (async (context) => {
      const { editor } = context

      async function addIdentifier(name: string, parent?: NodeId) {
        const node = new BaseNode('Identifier')

        node.type = 'expression'
        node.data.name = name
        node.parent = parent

        await editor.addNode(node)

        return node
      }
      async function addLiteral(label: string, value: number | string | boolean | bigint | null | unknown, parent?: NodeId) {
        const node = new BaseNode(label)

        node.type = 'expression'
        node.data.value = value as any // TODO
        node.parent = parent

        await editor.addNode(node)

        return node
      }

      const nodes = [...editor.getNodes()]

      for (const node of nodes) {
        const inputs = Object.entries(node.inputs)

        for (const [key, input] of inputs) {
          const control = input?.control as InputControl
          const inputConnections = editor.getConnections().filter(c => c.targetInput === key && c.target === node.id)

          if (inputConnections.length) continue

          const type = control?.options?.type

          if (type === 'identifier') {
            const name = String(control.value)
            const identifier = await addIdentifier(name, node.parent)

            await editor.addConnection(new Connection(identifier, BIND_KEY, node, key))
            if (input) input.control = null
          } else if (control && type) {
            const [label, defaultValue] = this.typeToLiteral(type)
            // const [label, defaultValue] = type === 'boolean'
            //   ? ['BooleanLiteral', false]
            //   : (type === 'number' ? ['NumericLiteral', 0] : ['StringLiteral', ''])
            const literal = await addLiteral(label, control.value ?? defaultValue, node.parent)

            await editor.addConnection(new Connection(literal, BIND_KEY, node, key))
            if (input) input.control = null
          }
        }
      }
    })(context)
  }
}
