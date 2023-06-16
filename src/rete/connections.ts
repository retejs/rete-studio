import { ClassicPreset } from 'rete'

export class Connection<A extends ClassicPreset.Node, B extends ClassicPreset.Node> extends ClassicPreset.Connection<A, B> {
  isLoop?: boolean
  secondary?: boolean
  identifier?: string

  constructor(source: A, sourceOutput: keyof A["outputs"], target: B, targetInput: keyof B["inputs"], props?: { secondary?: boolean, identifier?: string, isLoop?: boolean }) {
    super(source, sourceOutput, target, targetInput)
    this.isLoop = props?.isLoop
    this.identifier = props?.identifier
    this.secondary = props?.secondary
  }
}
