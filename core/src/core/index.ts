/* eslint-disable max-statements */
import { NodeEditor, Root, Scope } from 'rete'
import { structures } from 'rete-structures'

import { Output } from '../nodes'
import { socket } from '../sockets'
import { ClassicSchemes } from '../types'
import { copyToEditor } from '../utils'
import { Transformer } from './transformer'
import { ASTNodeBase, BIND_KEY, Context, ToASTContext, ToASTOptions, ToGraphOptions } from './types'

export * from './elaborate'
export type {
    EnsurePort
} from './methods'
export * from './methods'
export {
    Transformer
} from './transformer'
export * from './types'

export class UnexpectedNode {
    constructor(public node: any, public key: string, public item: any) { }
}

export type Options<ASTNode extends ASTNodeBase, S extends ClassicSchemes> = {
    transformers: Transformer<Context<ASTNode, S>, ToASTContext<ASTNode, S>>[]
    up: ToGraphOptions<ASTNode, S>
    down: ToASTOptions<ASTNode, S>
}

export class CodePlugin<Schemes extends ClassicSchemes, ASTNode extends ASTNodeBase> extends Scope<never, [Root<Schemes>]> {
    editor!: NodeEditor<Schemes>
    snapshots = new Map<string, NodeEditor<Schemes>>()

    constructor(private options: Options<ASTNode, Schemes>) {
        super('code')
    }

    setParent(scope: Scope<Root<Schemes>>): void {
        super.setParent(scope)

        this.editor = this.parentScope<NodeEditor<Schemes>>(NodeEditor)
    }

    private async astNodeIntoEditor<Node extends ASTNodeBase>(data: Node, context: Context<Node, Schemes>): Promise<Schemes['Node']> {
        const {
            editor,
            isSupported, isStatement, isExpression,
            createNode, createConnection, nodeCreated
        } = context

        if (!isSupported(data)) throw new Error('unsupported')

        const node = createNode(data.type)

        if (isStatement(data)) {
            node.type = 'statement'
        } else if (isExpression(data)) {
            node.type = 'expression'
        } else {
            node.type = 'unknown'
        }

        for (const key of Object.keys(data)) {
            const item = (data as Record<string, any>)[key]

            if (Array.isArray(item)) {
                for (const i in item) {
                    const id = `${key}[${i}]`
                    node.addOutput(id, new Output(socket, id, true))
                    const s = await this.astNodeIntoEditor(item[i], context)
                    await editor.addConnection(createConnection(node, id, s, BIND_KEY))
                }
            } else if (item && typeof item === 'object' && 'type' in item) {
                node.addOutput(key, new Output(socket, key, true))
                const s = await this.astNodeIntoEditor(item, context)
                await editor.addConnection(createConnection(node, key, s, BIND_KEY))
            } else {
                node.data[key] = item
            }
        }

        await editor.addNode(node)

        nodeCreated(node)

        return node
    }

    current = -1

    async applyAST(ast: ASTNode) {
        const tempEditor = new NodeEditor<Schemes>()

        await this.astNodeIntoEditor(ast, {
            ...this.options.up,
            editor: tempEditor
        })
        await this.copy(tempEditor, this.editor)
    }

    public async step(offset: number) {
        const target = this.current + offset
        const transformers = this.options.transformers
        console.log(this.current, target, offset)
        if (target < -1 || target >= transformers.length) throw new Error('step: out of bounds')

        while (this.current < target) {
            this.current++
            const transformer = transformers[this.current]

            await transformer.up({ ...this.options.up, editor: this.editor })
            console.log('up', transformer.name)
        }
        while (this.current > target) {
            const transformer = transformers[this.current]

            await transformers[this.current].down({ ...this.options.down, editor: this.editor })
            console.log('down', transformer.name)
            this.current--
        }
        console.log('step', this.current)
    }

    public getCurrentStep() {
        return this.current
    }

    public getTransformers() {
        return this.options.transformers
    }

    async retrieveAST<R extends ASTNode>(): Promise<R> {
        const roots = structures(this.editor).roots().nodes()

        if (roots.length > 1) throw new Error('toAST: Multiple roots')
        if (roots.length === 0) throw new Error('toAST: No roots')

        const root = roots[0]

        return this.nodeIntoAST<R>(root, { ...this.options.down, editor: this.editor })
    }

    async afterStep(ast: ASTNode) {
        const tempEditor = new NodeEditor<Schemes>()

        await this.astNodeIntoEditor(ast, {
            ...this.options.up,
            editor: tempEditor
        })
        await this.copy(tempEditor, this.editor)
    }

    async toGraph(ast: ASTNode) {
        const { transformers } = this.options
        const tempEditor = new NodeEditor<Schemes>()

        // console.time('processNode')
        await this.astNodeIntoEditor(ast, {
            ...this.options.up,
            editor: tempEditor
        })
        // console.timeEnd('processNode')

        // console.time('simplify')
        for (const transformer of transformers) {
            try {
                console.log('Start up:', transformer.name);
                await transformer.up({ ...this.options.up, editor: tempEditor })
                const snapshot = new NodeEditor<Schemes>()
                await this.copy(tempEditor, snapshot)
                this.snapshots.set('up '+transformer.name, snapshot)
                console.log('End up:', transformer.name);
            } catch (e) {
                await this.copy(tempEditor, this.editor)
                throw e
                // console.error('Simplify: ', e, '\n\nat', transformer)
            }
        }
        // console.timeEnd('simplify')

        await this.copy(tempEditor, this.editor)
    }

    private nodeIntoAST<N extends ASTNode>(node: Schemes['Node'], context: ToASTContext<ASTNode, Schemes>): N {
        const keys = context.nodeParameters(node.label)
        const args = keys.map(key => {
            if (node.data[key] !== undefined && node.data[key] !== null) return node.data[key]
            const connections = context.editor.getConnections().filter(c => {
                if (c.source !== node.id) return false
                if (c.sourceOutput === key) return true
                if (c.sourceOutput.match(/^.*\[\d+\]$/) && c.sourceOutput.startsWith(key)) return true
            })
            if (connections.length === 0) return context.defaults(node, key)
            if (connections[0].sourceOutput.match(/^.*\[\d+\]$/)) {
                return connections
                    .sort((a, b) => {
                        const aIndex = parseInt(a.sourceOutput.match(/^.*\[(\d+)\]$/)![1])
                        const bIndex = parseInt(b.sourceOutput.match(/^.*\[(\d+)\]$/)![1])
                        return aIndex - bIndex
                    })
                    .map(c => this.nodeIntoAST(context.editor.getNode(c.target), context))
            }
            if (connections.length > 1) throw new Error(`Multiple connections not allowed for ${key}`)
            return this.nodeIntoAST(context.editor.getNode(connections[0].target), context)
        })

        return context.createASTNode(node, args)
    }

    async toAST<R extends ASTNode>(): Promise<R> {
        const tempEditor = new NodeEditor<Schemes>()
        const transformers = [...this.options.transformers].reverse()

        await this.copy(this.editor, tempEditor)

        for (const transformer of transformers) {
            console.log('Start down:', transformer.name);
            await transformer.down({ ...this.options.down, editor: tempEditor })
            const snapshot = new NodeEditor<Schemes>()
            this.snapshots.set('down '+transformer.name, snapshot)
            await this.copy(tempEditor, snapshot)
            console.log('End down:', transformer.name, tempEditor.getConnections().length, tempEditor.getNodes().length);
        }

        const roots = structures(tempEditor).roots().nodes()

        if (roots.length > 1) throw new Error('toAST: Multiple roots')
        if (roots.length === 0) throw new Error('toAST: No roots')

        const root = roots[0]

        try {
            const ast = this.nodeIntoAST<R>(root, { ...this.options.down, editor: tempEditor })

            console.log('toAST', ast)
            return ast
        } catch (e) {
            console.error('toAST: ', e)
            throw e
        }
    }

    private async copy(from: NodeEditor<Schemes>, to: NodeEditor<Schemes>) {
        // console.time('clear')
        await to.clear()
        // console.timeEnd('clear')

        // console.time('copy')
        await copyToEditor(from, to)
        // console.timeEnd('copy')
    }
}
