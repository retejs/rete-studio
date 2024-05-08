import { ClassicPreset } from 'rete'

import { BaseNode } from './nodes'

export class Connection<A extends BaseNode, B extends BaseNode> extends ClassicPreset.Connection<A, B> {
  isLoop?: boolean
  secondary?: boolean
  identifier?: string

  constructor(source: A, sourceOutput: keyof A['outputs'], target: B, targetInput: keyof B['inputs'], props?: { secondary?: boolean, identifier?: string, isLoop?: boolean }) {
    super(source, sourceOutput, target, targetInput)
    this.isLoop = props?.isLoop
    this.identifier = props?.identifier
    this.secondary = props?.secondary
  }

  serialize(): JSONConnection {
    const {
      id, source, sourceOutput, target, targetInput, identifier, isLoop, secondary
    } = this

    return {
      id,
      source,
      sourceOutput,
      target,
      targetInput,
      identifier,
      isLoop,
      secondary
    }
  }

  static deserialize(data: JSONConnection, source: BaseNode, target: BaseNode) {
    const connection = new Connection(source, String(data.sourceOutput), target, String(data.targetInput), {
      isLoop: data.isLoop,
      identifier: data.identifier,
      secondary: data.secondary
    })
    connection.id = data.id

    return connection
  }
}

export type JSONConnection = {
  id: string
  source: string
  sourceOutput: string | number | symbol
  target: string
  targetInput: string | number | symbol
  identifier: string | undefined
  isLoop: boolean | undefined
  secondary: boolean | undefined
}
