import { ClassicPreset, NodeId } from 'rete'
import { BIND_KEY } from './core'
import { socket, Socket, JSONSocket, ControlSocket, RefSocket } from './sockets'
import { Control, InputControl, InsertControl, JSONControl, SelectControl } from './controls'

export type InputType = 'text' | 'number' | 'boolean' | 'identifier' | 'null' | 'bigint'
export const inputTypes: { label: string, value: InputType }[] = [
  { label: 'Identifier', value: 'identifier' },
  { label: 'Number', value: 'number' },
  { label: 'Text', value: 'text' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'null', value: 'null' },
  { label: 'BigInt', value: 'bigint' }
]

export type Sockets = ControlSocket | RefSocket | Socket

export class Input<S extends Socket> extends ClassicPreset.Input<S> {
  control!: Control | null
  alwaysVisibleControl?: boolean

  serialize(): JSONInput {
    return {
      id: this.id,
      label: this.label,
      index: this.index,
      multipleConnections: this.multipleConnections,
      alwaysVisibleControl: this.alwaysVisibleControl,
      socket: this.socket.serialize(),
      control: this.control?.serialize()
    }
  }

  static deserialize(data: JSONInput, socket: Socket, control?: Control) {
    const input = new Input(socket, data.label, data.multipleConnections)

    input.id = data.id
    input.index = data.index
    input.alwaysVisibleControl = data.alwaysVisibleControl
    if (control) input.addControl(control)

    return input
  }
}

export type JSONInput = {
  id: string
  label?: string
  index?: number
  multipleConnections?: boolean
  alwaysVisibleControl?: boolean
  socket: JSONSocket
  control?: JSONControl
}

export class Output<S extends Socket> extends ClassicPreset.Output<S> {
  control?: Control

  addControl(control: Control) {
    this.control = control
  }

  removeControl() {
    this.control = undefined
  }

  serialize(): JSONOutput {
    return {
      id: this.id,
      label: this.label,
      index: this.index,
      multipleConnections: this.multipleConnections,
      socket: this.socket.serialize(),
      control: this.control?.serialize()
    }
  }

  static deserialize(data: JSONOutput, socket: Socket, control?: Control) {
    const output = new Output(socket, data.label, data.multipleConnections)

    output.id = data.id
    output.index = data.index
    if (control) output.addControl(control)

    return output
  }
}

export type JSONOutput = {
  id: string
  label?: string
  index?: number
  multipleConnections?: boolean
  socket: JSONSocket
  control?: JSONControl
}

export type JSONBaseNode = {
  id: string
  width: number
  height: number
  parent?: NodeId
  label: string
  data: BaseNodeData
  frame?: {
    left?: boolean
    right?: boolean
  }
  type: 'statement' | 'expression' | 'unknown'
  inputs: Record<string, JSONInput>
  outputs: Record<string, JSONOutput>
  controls: Record<string, JSONControl>
}

type BaseNodeData = Record<string, string | number | undefined>

export class BaseNode extends ClassicPreset.Node<{ [key in string]: Sockets }, { [key in string]: Sockets }, { [key in string]: Control | InputControl | InsertControl | SelectControl }> {
  width = 300
  height = 30
  parent?: NodeId
  data: BaseNodeData = {}
  type: 'statement' | 'expression' | 'unknown' = 'unknown'
  frame?: {
    left?: boolean
    right?: boolean
  }
  inputs: { [key in string]?: Input<Sockets> } = {}
  outputs: { [key in string]?: Output<Sockets> } = {}
  controls: { [key in string]: Control | InputControl | InsertControl | SelectControl } = {}
  // loopBranch?: boolean

  constructor(label: string) {
    super(label)
    this.addInput(BIND_KEY, new Input(socket, '', true))
    this.addOutput(BIND_KEY, new Output(socket, '', true))
  }

  serialize(): JSONBaseNode {
    return {
      id: this.id,
      width: this.width,
      height: this.height,
      parent: this.parent,
      label: this.label,
      frame: this.frame,
      data: {
        ...this.data
      },
      type: this.type,
      inputs: Object.fromEntries(Object.entries(this.inputs).map(([key, input]) => input ? [key, input.serialize()] : [key])),
      outputs: Object.fromEntries(Object.entries(this.outputs).map(([key, output]) => output ? [key, output.serialize()] : [key])),
      controls: Object.fromEntries(Object.entries(this.controls).map(([key, control]) => control ? [key, control.serialize()] : [key])),
    }
  }

  static deserialize(
    data: JSONBaseNode,
    getInput: (data: JSONInput) => Input<Socket>,
    getOutput: (data: JSONOutput) => Output<Socket>,
    getControl: (data: JSONControl) => Control
  ) {
    const node = new BaseNode(data.label)

    node.id = data.id
    node.parent = data.parent
    node.data = data.data
    node.type = data.type
    node.frame = data.frame

    node.removeInput(BIND_KEY)
    node.removeOutput(BIND_KEY)
    Object.entries(data.inputs).forEach(([key, input]) => {
      node.addInput(key, getInput(input))
    })
    Object.entries(data.outputs).forEach(([key, output]) => {
      node.addOutput(key, getOutput(output))
    })
    Object.entries(data.controls).forEach(([key, control]) => {
      node.addControl(key, getControl(control))
    })

    return node
  }

  addInput<K extends string>(key: K, input: Input<Socket>): void {
    super.addInput(key, input)
    this.updateSize()
  }

  removeInput(key: string): void {
    if (this.hasInput(key)) {
      super.removeInput(key)
      this.updateSize()
    }
  }

  addOutput<K extends string>(key: K, output: Output<Socket>): void {
    super.addOutput(key, output)
    this.updateSize()
  }

  removeOutput(key: string): void {
    if (this.hasOutput(key)) {
      super.removeOutput(key)
      this.updateSize()
    }
  }

  addControl(key: string, control: Control): void {
    super.addControl<string>(key, control)
    this.updateSize()
  }

  removeControl(key: string): void {
    super.removeControl(key)
    this.updateSize()
  }

  updateSize() {
    const inputs = Object.entries(this.inputs)
    const outputs = Object.entries(this.outputs)
    const controls = Object.entries(this.controls)

    this.height = 40 + 4 + 5
      + Math.max(inputs.length, outputs.length) * 36
      + controls.length * 36

    const inputsWidths = inputs.map(([_, i]) => i?.control ? 120 : (50 + (i?.label?.length || 0) * 6))
    const outputsWidths = outputs.map(([_, i]) => i?.control ? 120 : (50 + (i?.label?.length || 0) * 6))
    const labelWidth = this.label ? this.label.length * 12 : 0
    // const controlsWidths = controls.map(([_, i]) => 100)

    this.width = Math.max(labelWidth, 50 + Math.max(...inputsWidths, 0) + Math.max(...outputsWidths, 0))// + Math.max(...controlsWidths, 0)
  }

  clone = (keepId?: boolean) => {
    const n = new BaseNode(this.label)
    if (keepId) n.id = this.id
    n.removeInput(BIND_KEY)
    Object.keys(this.inputs).forEach(k => {
      const inp = this.inputs[k]
      if (inp && !n.hasInput(k)) {
        const clone = new Input(inp.socket.clone(), inp.label, true)

        clone.index = inp.index
        if (inp.control) {
          if (!('clone' in inp.control)) throw new Error('Input control must implement clone method')
          clone.control = (inp.control as any).clone()
        }
        n.addInput(k, clone)
      }
    })
    n.removeOutput(BIND_KEY)
    Object.keys(this.outputs).forEach(k => {
      const out = this.outputs[k]
      if (out && !n.hasOutput(k)) {
        const clone = new Output(out.socket.clone(), out.label, true)
        clone.index = out.index
        if (out.control) {
          if (!('clone' in out.control)) throw new Error('Output control must implement clone method')
          clone.control = (out.control as any).clone()
        }
        n.addOutput(k, clone)
      }
    })
    Object.keys(this.controls).forEach(k => {
      const control = this.controls[k]
      if (control && !n.hasControl(k)) {
        if (!('clone' in control)) throw new Error('Control must implement clone method')

        n.addControl(k, (control as any).clone())
      }
    })
    n.type = this.type
    n.parent = this.parent
    n.height = this.height
    n.width = this.width
    n.data = {
      ...this.data
    }
    n.frame = this.frame ? { ...this.frame } : undefined

    return n
  }
}
