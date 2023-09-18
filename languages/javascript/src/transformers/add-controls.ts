import { getUID } from 'rete'
import {
  ASTNodeBase, Context, Input, InputControl, InsertControl, Output, RefSocket, Schemes, SelectControl, Socket,
  socket,
  ToASTContext
} from 'rete-studio-core'

import { Transformer } from './interface'

export class AddControls<ASTNode extends ASTNodeBase, S extends Schemes> extends Transformer<Context<ASTNode, S>, ToASTContext<ASTNode, S>> {
  constructor() {
    super('add controls')
  }

  createInsertButton(key: string, side: 'input' | 'output', needControl?: boolean) {
    return new InsertControl({
      onClick: (control) => {
        const activeNode = control.node

        if (!activeNode || !control.onUpdateNode) return
        const list = side === 'input' ? activeNode.inputs : activeNode.outputs
        const index = Object.keys(list).filter(k => k.startsWith(key)).length
        const arrayKey = `${key}[${index}]`

        if (side === 'input') {
          const input = new Input(socket, arrayKey, true)

          if (needControl && !input.control) {
            const control = new InputControl({ type: 'text' })

            control.node = activeNode
            input.control = control
          }

          activeNode.addInput(arrayKey, input)
        } else {
          const identifier = `arg${getUID()}`
          const output = new Output(new RefSocket('Reference', identifier), arrayKey, true)

          if (needControl && !output.control) {
            const control = this.createOutputIdentifierControl(identifier, arrayKey)

            output.control = control
          }
          activeNode.addOutput(arrayKey, output)
        }

        activeNode.updateSize()
        control.onUpdateNode()
      }
    })
  }

  private createOutputIdentifierControl(identifier: string, key: string) {
    const control = new InputControl({
      type: 'identifier',
      initial: identifier,
      allowedTypes: ['identifier'],
      change(value) {
        const activeNode = control.node

        if (!activeNode) return

        (activeNode.outputs[key]!.socket as RefSocket).identifier = String(value)
      }
    })

    return control
  }

  private createTextControl(value: string | number, key: string) {
    const control = new InputControl({
      type: 'text',
      initial: value,
      change(value) {
        const activeNode = control.node

        if (!activeNode) return

        activeNode.data[key] = value
      }
    })

    return control
  }

  async up(context: Context<ASTNode, S>) {
    const { editor } = context

    for (const node of editor.getNodes()) {
      if (['ClassBody'].includes(node.label)) {
        node.addControl('insert', this.createInsertButton('body', 'input'))
      }
      if (['CallExpression'].includes(node.label)) {
        node.addControl('insert', this.createInsertButton('arguments', 'input', true))
      }
      if (['ArrayExpression'].includes(node.label)) {
        node.addControl('insert', this.createInsertButton('elements', 'input', true))
      }
      if (['ObjectExpression'].includes(node.label)) {
        node.addControl('insert', this.createInsertButton('properties', 'input'))
      }
      if (['FunctionExpression', 'ArrowFunctionExpression', 'Constructor'].includes(node.label)) {
        const entry = editor.getNodes().find((n) => n.parent === node.id && n.label === 'Entry')

        if (!entry) throw new Error('AddControls: entry node not found')

        entry.addControl('insert', this.createInsertButton('params', 'output', true))
      }
      if (['ThrowStatement'].includes(node.label)) {
        const input = node.inputs['argument']!

        if (!input.control) {
          input.control = new InputControl({ type: 'text' })
        }
      }
      if (['ExpressionStatement'].includes(node.label)) {
        const input = node.inputs['expression']!

        if (!input.control) {
          input.control = new InputControl({ type: 'identifier' })
        }
      }
      if (['ArrayExpression'].includes(node.label)) {
        for (const [key, input] of Object.entries(node.inputs)) {
          if (input && key.startsWith('elements')) {
            if (!input.control) {
              input.control = new InputControl({ type: 'identifier' })
            }
          }
        }
      }
      if (['BinaryExpression'].includes(node.label)) {
        const left = node.inputs['left']!
        const right = node.inputs['right']!

        if (!left.control) {
          left.control = new InputControl({ type: 'identifier' })
        }
        if (!right.control) {
          right.control = new InputControl({ type: 'identifier' })
        }
      }
      if (['RegExpLiteral'].includes(node.label)) {
        node.addControl('pattern', this.createTextControl(String(node.data.pattern), 'pattern'))
        node.addControl('flags', this.createTextControl(String(node.data.flags || ''), 'flags'))
      }
      if (['ObjectProperty'].includes(node.label)) {
        const keyInput = node.inputs['key']!

        if (!keyInput.control) keyInput.addControl(new InputControl({ type: 'text', initial: '' }))
      }
      if (['VariableDeclarator'].includes(node.label)) {
        const options = [{ value: 'var', label: 'Var' }, { value: 'let', label: 'Let' }, { value: 'const', label: 'Const' }]
        const init = node.inputs['init']!

        if (!init.control) init.addControl(new InputControl({ type: 'identifier', initial: '' }))
        node.addControl('kind', new SelectControl(String(node.data.kind), options, (key, control) => {
          const activeNode = control.node

          if (!activeNode) return

          activeNode.data.kind = key
        }))
      }
      if (['UpdateExpression'].includes(node.label) && ['++', '--'].includes(String(node.data.operator))) {
        const options = [{ value: 'prefix', label: 'Prefix' }, { value: 'postfix', label: 'Postfix' }]

        node.addControl('prefix', new SelectControl(node.data.prefix ? 'prefix' : 'postfix', options, (key, control) => {
          const activeNode = control.node

          if (!activeNode) return

          activeNode.data.prefix = (key === 'prefix') as any
        }))
      }
      const outputs = Object.entries(node.outputs)
        .filter(([, output]) => output && output.socket instanceof RefSocket) as [string, Output<RefSocket>][]

      for (const [key, output] of outputs) {
        if (!output.socket.identifier) throw new Error('AddControls: output identifier not found')
        const control = this.createOutputIdentifierControl(output.socket.identifier, key)

        output.addControl(control)
      }
    }
  }

  async down(context: ToASTContext<ASTNode, S>): Promise<void> {
    const { editor } = context

    for (const node of editor.getNodes()) {
      const identifierInputs = Object.entries(node.inputs)
        .filter(([, input]) => input && input.control instanceof InputControl && input.control.options?.type === 'identifier')
        .map(([key, input]) => [key, input, input?.control] as [string, Input<Socket>, InputControl])

      for (const [, input, control] of identifierInputs) {
        if (!control.value) input.removeControl()
      }
    }
  }
}
