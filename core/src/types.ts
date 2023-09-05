import { ClassicPreset, GetSchemes } from 'rete'
import { Connection } from './connections'
import { BaseNode } from './nodes'

export type NodeProps = BaseNode
export type ConnProps = Connection<BaseNode, BaseNode>
export type Schemes = GetSchemes<NodeProps, ConnProps>

interface Cloneable {
  clone(keepId?: boolean): this;
}

type ClassicNode = ClassicPreset.Node & { type: string, data: Record<string, any>, parent?: string } & Cloneable
type C<S extends ClassicNode, T extends ClassicNode> = ClassicPreset.Connection<S, T> & { isLoop?: boolean }

export type ClassicSchemes = GetSchemes<ClassicNode, C<ClassicNode, ClassicNode>>

export type Size = { width: number, height: number }
