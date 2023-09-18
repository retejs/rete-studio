import { ClassicPreset, NodeId } from 'rete'
import { BIND_KEY } from './core'
import { socket, Socket } from './sockets'
import { Schemes } from './types'
export { socket, Socket }

export class InsertControl extends ClassicPreset.Control {
  // TODO improve DI
  public node?: Schemes['Node']
  public onUpdateNode?: () => void

  constructor(public options: { onClick: (control: InsertControl) => void }) {
    super()
  }

  clone() {
    return new InsertControl({
      onClick: this.options.onClick
    })
  }
}

export class SelectControl extends ClassicPreset.Control {
  public node?: Schemes['Node']

  constructor(public value: string, public options: { value: string, label: string }[], public onChange: (value: string, control: SelectControl) => void) {
    super()
  }

  change(key: string) {
    this.value = key
    this.onChange(key, this)
  }

  clone() {
    return new SelectControl(this.value, this.options, this.onChange)
  }
}


export class RefSocket extends Socket {
  isRef = true
  constructor(public name: string, public identifier?: string) {
    super(name)
  }

  clone() {
    return new RefSocket(this.name, this.identifier)
  }
}

export class ControlSocket extends Socket {
  isControl = true

  clone() {
    return new ControlSocket(this.name)
  }
}

export type InputType = 'text' | 'number' | 'boolean' | 'identifier' | 'null' | 'bigint'
export const inputTypes: { label: string, value: InputType }[] = [
  { label: 'Identifier', value: 'identifier' },
  { label: 'Number', value: 'number' },
  { label: 'Text', value: 'text' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'null', value: 'null' },
  { label: 'BigInt', value: 'bigint' }
]

export class InputControl extends ClassicPreset.InputControl<'text' | 'number'> {
  public node?: Schemes['Node']

  constructor(public options?: {
    type: InputType,
    readonly?: boolean
    initial?: string | number
    change?: (value: string | number) => void
    allowedTypes?: InputType[]
  }) {
    super('text', options)
  }

  setValue(value?: string | number | undefined): void {
    const type = this.options?.type

    super.setValue(type === 'number' && typeof value !== 'undefined' ? +value : value)
  }

  clone() {
    return new InputControl({
      type: this.options?.type || 'text',
      readonly: this.readonly,
      initial: this.value,
      allowedTypes: this.options?.allowedTypes ? [...this.options.allowedTypes] : undefined,
      change: this.options?.change
    })
  }
}

export type Sockets = ControlSocket | RefSocket | Socket

export class Input<S extends Socket> extends ClassicPreset.Input<S> {
  alwaysVisibleControl?: boolean
}
export class Output<S extends Socket> extends ClassicPreset.Output<S> {
  control?: ClassicPreset.Control

  addControl(control: ClassicPreset.Control) {
    this.control = control
  }

  removeControl() {
    this.control = undefined
  }
}

export class BaseNode extends ClassicPreset.Node<{ [key in string]: Sockets }, { [key in string]: Sockets }, { [key in string]: ClassicPreset.Control | InputControl | InsertControl | SelectControl }> {
  width = 300
  height = 30
  parent?: NodeId
  data: Record<string, string | number> = {}
  type: 'statement' | 'expression' | 'unknown' = 'unknown'
  frame?: {
    left?: boolean
    right?: boolean
  }
  inputs: { [key in string]?: Input<Sockets> } = {}
  outputs: { [key in string]?: Output<Sockets> } = {}
  controls: { [key in string]: ClassicPreset.Control | InputControl | InsertControl | SelectControl } = {}
  // loopBranch?: boolean

  constructor(label: string) {
    super(label)
    this.addInput(BIND_KEY, new Input(socket, '', true))
    this.addOutput(BIND_KEY, new Output(socket, '', true))
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

  addControl(key: string, control: ClassicPreset.Control): void {
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
    // const controls = Object.entries(this.controls)

    this.height = 40 + 4 + 5
      + Math.max(inputs.length, outputs.length) * 35
      + Object.entries(this.controls).length * 35

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
        const clone = new ClassicPreset.Input(inp.socket.clone(), inp.label, true)

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
