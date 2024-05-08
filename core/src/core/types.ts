import { ClassicPreset, NodeEditor } from 'rete'

import type { Socket } from '../sockets'
import { ClassicSchemes } from '../types'

export const BIND_KEY = 'bind'

export type ASTNodeBase = { type: string }

export type BaseOptions<S extends ClassicSchemes> = {
    createInput: (label?: string) => ClassicPreset.Input<Socket>
    createOutput: (label?: string) => ClassicPreset.Output<Socket>
    createNode: (type: string) => S['Node']
    createConnection: (source: S['Node'], sourceOutput: string, target: S['Node'], targetInput: string, options?: { isLoop?: boolean, identifier?: string }) => S['Connection']
}
export type ToGraphOptions<ASTNode extends ASTNodeBase, S extends ClassicSchemes> = BaseOptions<S> & {
    isSupported: (node: ASTNode) => boolean
    isStatement: (node: ASTNode) => boolean
    isExpression: (node: ASTNode) => boolean
    nodeCreated: (node: S['Node']) => void
}

export type Context<ASTNode extends ASTNodeBase, S extends ClassicSchemes> = ToGraphOptions<ASTNode, S> & {
    editor: NodeEditor<S>
}

export type ToASTOptions<ASTNode extends ASTNodeBase, S extends ClassicSchemes> = BaseOptions<S> & {
    nodeParameters: (label: string) => string[]
    createASTNode: <N extends ASTNode, A extends any[]>(node: S['Node'], args: A) => N
    defaults: (source: S['Node'], key: string) => any | undefined
}

export type ToASTContext<ASTNode extends ASTNodeBase, S extends ClassicSchemes> = ToASTOptions<ASTNode, S> & {
    editor: NodeEditor<S>
}
