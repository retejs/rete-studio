/* eslint-disable max-statements */
import { ClassicPreset, NodeEditor, NodeId } from 'rete'

import { Input, Output, Sockets } from '../nodes'
import { ClassicSchemes } from '../types'
import { MirrorContext, mirrorInput, mirrorOutput, removeNodeWithConnections } from '../utils'
import { ASTNodeBase, BaseOptions, BIND_KEY, Context } from './types'

type PromiseLike<T> = Promise<T> | T

// reusable
export function forEach<ASTNode extends ASTNodeBase, S extends ClassicSchemes>(match: (node: S['Node']) => boolean, command: (node: S['Node'], context: Context<ASTNode, S>) => PromiseLike<undefined | void | ((context: Context<ASTNode, any>) => Promise<void>)>) {
  return async (context: Context<ASTNode, S>) => {
    for (const node of context.editor.getNodes().filter(match)) {
      const act = await command(node, context)

      if (act) await act(context)
    }
  }
}

// reusable
export async function createSuperStatement<S extends ClassicSchemes>(context: { editor: NodeEditor<S> } & BaseOptions<S>, name: string, parent?: string) {
  const { editor, createNode } = context
  const node = createNode(name)
  node.parent = parent
  node.type = 'statement'

  await editor.addNode(node)
  return node
}

// reusable
export async function expressionToExpressionStatement<ASTNode extends ASTNodeBase, S extends ClassicSchemes>(context: Context<ASTNode, S>, node: S['Node'], input: string, createStatement: () => Promise<S['Node']>) {
  const { editor, createConnection, createOutput } = context
  const statement = await createStatement()

  const [expression, expressionConnection] = getInputNode(context, node.id, input)

  await editor.removeConnection(expressionConnection.id)

  node.removeInput(input)
  node.addOutput(input, createOutput(input))

  await editor.addConnection(createConnection(expression, expressionConnection.sourceOutput, statement, 'expression'))
  await editor.addConnection(createConnection(node, input, statement, BIND_KEY))

  return statement
}

// reusable
export function patchPlaceholderPorts<S extends ClassicSchemes>(match: (node: S['Node']) => (undefined | { inputs?: { key: string }[], outputs?: { key: string, flow?: boolean }[] })) {
  return async (context: { editor: NodeEditor<S> } & BaseOptions<S>) => {
    const { editor, createInput, createOutput, createConnection } = context

    for (const node of editor.getNodes()) {
      const result = match(node)

      if (result) {
        const { inputs = [], outputs = [] } = result

        for (const inp of inputs) {
          if (!node.hasInput(inp.key)) node.addInput(inp.key, createInput(inp.key))
        }
        for (const out of outputs) {
          if (!node.hasOutput(out.key)) {
            node.addOutput(out.key, createOutput(out.key))
          }
          const [existingNode] = getOutputNode(context, node.id, out.key, false)

          if (!existingNode && out.flow) {
            const end = await createSuperStatement(context, 'Placeholder') // , node.parent) // TODO in OmitLabeled parent is not needed, should it be used at all?

            await editor.addConnection(createConnection(node, out.key, end, BIND_KEY))
          }
        }
      }
    }
  }
}

// reusable
export function mirrorRight<ASTNode extends ASTNodeBase, S extends ClassicSchemes>(
  match: (node: S['Node'], key: string) => boolean,
  ignore: (node: S['Node'], key: string, side: 'input' | 'output') => boolean,
) {
  return async (context: Pick<Context<ASTNode, S>, 'editor' | 'createInput' | 'createOutput' | 'createConnection'>) => {
    const { editor } = context
    const mirrorContext: MirrorContext<S> = {
      ignore,
      ...context
    }

    await mirrorOutput(editor, (id, key) => match(editor.getNode(id), key), mirrorContext)
  }
}

// reusable
export function mirrorLeft<ASTNode extends ASTNodeBase, S extends ClassicSchemes>(
  match: (node: S['Node'], key: string) => boolean,
  ignore: (node: S['Node'], key: string, side: 'input' | 'output') => boolean,
) {
  return async (context: Pick<Context<ASTNode, S>, 'editor' | 'createInput' | 'createOutput' | 'createConnection'>) => {
    const { editor } = context
    const mirrorContext: MirrorContext<S> = {
      ignore,
      ...context
    }

    await mirrorInput(editor, (id, key) => match(editor.getNode(id), key), mirrorContext)
  }
}

// reusable
export function simplifyIdentifiers<ASTNode extends ASTNodeBase, S extends ClassicSchemes>(
  matchProducer: (node: S['Node'], context: Context<ASTNode, S>) => boolean,
  matchConsumer: (node: S['Node'], context: Context<ASTNode, S>) => boolean,
  producerMatched?: (node: S['Node'], connection: S['Connection'], context: Context<ASTNode, S>) => void,
  consumerMatched?: (node: S['Node'], connection: S['Connection'], context: Context<ASTNode, S>) => void
) {
  return async (context: Context<ASTNode, S>) => {
    const { editor, createConnection } = context
    const producers: { identifier: string, identifierNode: string, node: string, output: string }[] = []
    const consumers: { identifier: string, identifierNode: string, node: string, input: string }[] = []

    for (const identifier of [...editor.getNodes()]) {
      if (matchProducer(identifier, context)) {
        const inpCon = editor.getConnections().find(c => c.target === identifier.id && c.targetInput === BIND_KEY)

        if (!inpCon) throw new Error('inpCon')

        producers.push({ identifier: identifier.data.name as string, identifierNode: identifier.id, node: inpCon.source, output: inpCon.sourceOutput })
        await removeNodeWithConnections(editor, identifier.id)
        if (producerMatched) producerMatched(identifier, inpCon, context)
      } else if (matchConsumer(identifier, context)) {
        const inpCon = editor.getConnections().find(c => c.source === identifier.id && c.sourceOutput === BIND_KEY)

        if (!inpCon) throw new Error('inpCon')
        const { target, targetInput } = inpCon

        consumers.push({ identifier: identifier.data.name as string, identifierNode: identifier.id, node: target, input: targetInput })
        if (consumerMatched) consumerMatched(identifier, inpCon, context)
      }
    }

    function findIdentifier(identifier: string, scope: string | undefined): null | {
      identifier: string;
      node: string;
      output: string;
    } {
      const allMatches = producers.filter(p => p.identifier === identifier)

      if (allMatches.length === 0) return null

      const scopedMatches = allMatches.filter(m => editor.getNode(m.node).parent === scope)

      if (scopedMatches.length === 1) return scopedMatches[0]
      if (scopedMatches.length > 1) {
        console.warn({ scopedMatches })
        throw new Error('found more than 1 identifier')
      }
      if (!scope) return null

      return findIdentifier(identifier, editor.getNode(scope).parent)
    }

    for (const consumer of consumers) {
      const consumerNode = editor.getNode(consumer.node)
      const producer = findIdentifier(consumer.identifier, consumerNode.parent)

      if (producer) {
        const producerNode = editor.getNode(producer.node)

        await removeNodeWithConnections(editor, consumer.identifierNode)
        await editor.addConnection(createConnection(producerNode, producer.output, consumerNode, consumer.input))
      }
    }
  }
}

// reusable
async function convertNodeToInput<S extends ClassicSchemes>(editor: NodeEditor<S>, match: (node: S['Node']) => boolean, createControl: (node: S['Node']) => ClassicPreset.Control) {
  for (const node of editor.getNodes().filter(match)) {
    const outputCons = editor.getConnections().filter(c => c.source === node.id)

    if (outputCons.length === 0) continue // TODO throw new Error('cannot find outgoing node')
    if (outputCons.length > 1) throw new Error('multiple outgoers are not supported')

    const outputConnection = outputCons[0]
    const target = editor.getNode(outputConnection.target)
    const input = target.inputs[outputConnection.targetInput]

    if (!input) {
      console.warn({ node, target, input, con: outputConnection })
      throw new Error('cannot find input')
    }

    input.addControl(createControl(node))
    await removeNodeWithConnections(editor, node.id)
  }
}

// reusable
export function simplifyLiterals<S extends ClassicSchemes>(match: (node: S['Node']) => boolean, createControl: (node: S['Node']) => ClassicPreset.Control) {
  return async <ASTNode extends ASTNodeBase>(context: Context<ASTNode, S>) => {
    const { editor } = context

    await convertNodeToInput(editor, match, createControl)
  }
}

// reusable
export function getInputNode<ASTNode extends ASTNodeBase, S extends ClassicSchemes>({ editor }: Pick<Context<ASTNode, S>, 'editor'>, nodeId: NodeId, inputKey: string): [S['Node'], S['Connection']]
export function getInputNode<ASTNode extends ASTNodeBase, S extends ClassicSchemes>({ editor }: Pick<Context<ASTNode, S>, 'editor'>, nodeId: NodeId, inputKey: string, mandatory: false): [undefined, undefined] | [S['Node'], S['Connection']]
export function getInputNode<ASTNode extends ASTNodeBase, S extends ClassicSchemes>({ editor }: Pick<Context<ASTNode, S>, 'editor'>, nodeId: NodeId, inputKey: string, mandatory = true): [undefined, undefined] | [S['Node'], S['Connection']] {
  const connections = editor.getConnections().filter(c => c.target === nodeId && c.targetInput === inputKey)

  if (mandatory && !connections.length) {
    console.warn({ nodeId, inputKey })
    throw new Error('doesnt have input connection')
  }
  if (connections.length > 1) throw new Error('found more than 1 connection')

  const connection = connections[0]

  return connection ? [editor.getNode(connection.source), connection] : [undefined, undefined]
}

// reusable
export function getOutputNode<ASTNode extends ASTNodeBase, S extends ClassicSchemes>({ editor }: Pick<Context<ASTNode, S>, 'editor'>, nodeId: NodeId, outputKey: string): [S['Node'], S['Connection']]
export function getOutputNode<ASTNode extends ASTNodeBase, S extends ClassicSchemes>({ editor }: Pick<Context<ASTNode, S>, 'editor'>, nodeId: NodeId, outputKey: string, mandatory: false): [undefined, undefined] | [S['Node'], S['Connection']]
export function getOutputNode<ASTNode extends ASTNodeBase, S extends ClassicSchemes>({ editor }: Pick<Context<ASTNode, S>, 'editor'>, nodeId: NodeId, outputKey: string, mandatory = true): [undefined, undefined] | [S['Node'], S['Connection']] {
  const connections = editor.getConnections().filter(c => c.source === nodeId && c.sourceOutput === outputKey)

  if (mandatory && !connections.length) {
    // console.warn({ nodeId, outputKey, node: editor.getNode(nodeId) })
    throw new Error('doesnt have output connection')
  }
  if (connections.length > 1) throw new Error('found more than 1 connection')

  const connection = connections[0]

  return connection ? [editor.getNode(connection.target), connection] : [undefined, undefined]
}

export function findLabeledStatement<ASTNode extends ASTNodeBase, S extends ClassicSchemes>({ editor }: Pick<Context<ASTNode, S>, 'editor'>, nodeId: string): S['Node'];
export function findLabeledStatement<ASTNode extends ASTNodeBase, S extends ClassicSchemes>({ editor }: Pick<Context<ASTNode, S>, 'editor'>, nodeId: string, optional: true): S['Node'] | null;
export function findLabeledStatement<ASTNode extends ASTNodeBase, S extends ClassicSchemes>({ editor }: Pick<Context<ASTNode, S>, 'editor'>, nodeId: string, optional = false) {
  function findLabel(nodeId: NodeId, label?: string): S['Node'] | null {
    const cons = editor.getConnections().filter(c => c.target === nodeId && !c.isLoop)
    const nodes = cons.map(c => editor.getNode(c.source))

    const labeledConn = cons.find(c => {
      const n = editor.getNode(c.source)
      if (n.label === 'LabeledStatement' && c.sourceOutput === 'body') {
        if (label) {
          const [labelNode] = getOutputNode({ editor }, n.id, 'label')
          return labelNode.data.name === label
        }
        return true
      }
    })

    if (labeledConn) return editor.getNode(labeledConn.source)

    for (const n of nodes) {
      const found = findLabel(n.id, label)
      if (found) return found
    }

    return null
  }

  const [labelNode] = getOutputNode({ editor }, nodeId, 'label', false)
  const label = labelNode ? String(labelNode.data.name) : undefined
  const labeledStatement = findLabel(nodeId, label)

  if (!optional && !labeledStatement) throw new Error('Could not find labeled statement')

  return labeledStatement
}

export function rename<ASTNode extends ASTNodeBase, S extends ClassicSchemes>(rename: (node: S['Node']) => string | undefined | void, update?: (node: S['Node']) => unknown) {
  return async ({ editor }: Pick<Context<ASTNode, S>, 'editor'>) => {
    for (const node of [...editor.getNodes()]) {
      const label = rename(node)

      if (label) {
        node.label = label
        update?.(node)
      }
    }
  }
}

export function markClosures<S extends ClassicSchemes, ASTNode extends ASTNodeBase>(props: {
  isStart: (node: S['Node']) => boolean
  isClosure: (node: S['Node']) => boolean
}) {
  async function traverse(node: S['Node'], context: Context<ASTNode, S>, closureId?: string) {
    const { editor, createNode } = context
    const cons = editor.getConnections().filter(c => c.source === node.id)
    const nodes = cons.map(c => editor.getNode(c.target))

    let closure: S['Node'] | null = null

    if (props.isClosure(node)) {
      closure = createNode('Closure')
      closure.parent = closureId

      await editor.addNode(closure)
    } else {
      closure = closureId ? editor.getNode(closureId) : null
    }
    node.parent = closure?.id

    for (const node of nodes) {
      await traverse(node, context, closure?.id)
    }
  }

  return async (context: Context<ASTNode, S>) => {
    const startNode = context.editor.getNodes().find(props.isStart)

    if (!startNode) throw new Error('start node not found')

    await traverse(startNode, context)
  }
}

import { treeToFlow as treeToFlowOrigin } from '../transformers'
import { structures } from 'rete-structures'

export function treeToFlow<S extends ClassicSchemes, ASTNode extends ASTNodeBase>(props: {
  isStart: (node: S['Node']) => boolean
  isSequence: (node: S['Node']) => false | RegExp | string
  getBlockParameterName(node: S['Node'], context: any): { array: boolean, key: string },
  isBranch: (node: S['Node']) => false | RegExp | string
}) {
  return async (context: Context<ASTNode, S>) => {
    const data = structures({
      nodes: context.editor.getNodes(),
      connections: context.editor.getConnections(),
    }).filter(n => n.type === 'statement' || props.isStart(n))

    const result = treeToFlowOrigin({
      nodes: data.nodes(),
      connections: data.connections(),
      closures: {}
    }, {
      isStartNode: props.isStart,
      isBlock: n => props.isSequence(n),
      getBlockParameterName: n => props.getBlockParameterName(n, context),
      createConnection: context.createConnection
    })

    const connectionsToRemove = context.editor.getConnections().filter(c => !result.connections.find(r => r.id === c.id) && context.editor.getNode(c.target).type === 'statement')
    const connectionsToAdd = result.connections.filter(r => !context.editor.getConnections().find(c => c.id === r.id))

    console.log(result, { connectionsToRemove, connectionsToAdd })

    for (const c of connectionsToRemove) {
      await context.editor.removeConnection(c.id)
    }
    for (const c of connectionsToAdd) {
      await context.editor.addConnection(c)
    }

  }
}

// reusable
export function removeRedunantNodes<S extends ClassicSchemes, ASTNode extends ASTNodeBase>(match: (node: S['Node']) => boolean, reconnect = true) {
  return async ({ editor, createConnection }: Context<ASTNode, S>) => {
    for (const node of [...editor.getNodes()]) {
      if (match(node)) {
        if (reconnect) {
          const inputs = editor.getConnections().filter(c => c.target === node.id)
          const outputs = editor.getConnections().filter(c => c.source === node.id)

          if (outputs.length > 1) throw new Error('outputs')

          if (outputs[0]) {
            for (const input of inputs) {
              const c = createConnection(editor.getNode(input.source), input.sourceOutput, editor.getNode(outputs[0].target), outputs[0].targetInput)

              await editor.addConnection(c)
            }
          }
        }

        await removeNodeWithConnections(editor, node.id)
      }
    }
  }
}

export async function collapsePort<Schemes extends ClassicSchemes, ASTNode extends ASTNodeBase, S extends 'input' | 'output', P extends (S extends 'input' ? Input<Sockets> : Output<Sockets>)>(
  context: Context<ASTNode, Schemes>,
  [from, fromPort]: [Schemes['Node'], string],
  [to, toPort]: [Schemes['Node'], string],
  side: S,
  apply: (from: P, to: P) => void
) {
  const { editor, createConnection } = context
  const sidePorts = `${side}s` as const
  const port = to[sidePorts][toPort] as P
  const prevPort = from[sidePorts][fromPort] as P

  if (!port || !prevPort) throw new Error(`cannot find ${side} port`)

  apply(prevPort, port)

  const connections = editor.getConnections().filter(c => {
    return side === 'output' ? c.source === from.id && c.sourceOutput === fromPort : c.target === from.id && c.targetInput === fromPort
  })

  for (const connection of connections) {
    await editor.addConnection(side === 'output'
      ? createConnection(to, toPort, editor.getNode(connection.target), connection.targetInput)
      : createConnection(editor.getNode(connection.source), connection.sourceOutput, to, toPort)
    )
  }
}

export function cleanUpPorts<ASTNode extends ASTNodeBase, S extends ClassicSchemes>(
  exclude: (node: S['Node']) => undefined | ({ inputs?: string[], outputs?: string[] }),
  onRemove: (node: S['Node'], key: string, port: S['Node']['inputs'][string] | S['Node']['outputs'][string]) => void
) {
  return async ({ editor }: Pick<Context<ASTNode, S>, 'editor'>) => {
    for (const node of [...editor.getNodes()]) {
      const result = exclude(node)

      if (result) {
        const { inputs = [], outputs = [] } = result

        inputs.forEach(input => {
          if (editor.getConnections().filter(c => c.target === node.id && c.targetInput === input).length) return
          onRemove(node, input, node.inputs[input] as any)
          node.removeInput(input)
        })
        outputs.forEach(output => {
          if (editor.getConnections().filter(c => c.source === node.id && c.sourceOutput === output).length) return
          onRemove(node, output, node.outputs[output] as any)
          node.removeOutput(output)
        })
      }
    }
  }
}

export type EnsurePort = string | [string, () => ClassicPreset.Socket]

export function ensurePorts<ASTNode extends ASTNodeBase, S extends ClassicSchemes>(
  include: (node: S['Node']) => undefined | ({ inputs?: EnsurePort[], outputs?: EnsurePort[] }),
  onAdd: (node: S['Node'], key: string, port: S['Node']['inputs'][string] | S['Node']['outputs'][string]) => void
) {
  return async ({ editor, createInput, createOutput }: Pick<Context<ASTNode, S>, 'editor' | 'createInput' | 'createOutput'>) => {
    for (const node of [...editor.getNodes()]) {
      const result = include(node)

      if (result) {
        const { inputs = [], outputs = [] } = result

        inputs.forEach(input => {
          const [key, socket] = Array.isArray(input) ? input : [input]
          if (node.inputs[key]) return
          node.addInput(key, createInput(key))
          if (socket) node.inputs[key]!.socket = socket()
          onAdd(node, key, node.inputs[key] as any)
        })
        outputs.forEach(output => {
          const [key, socket] = Array.isArray(output) ? output : [output]
          if (node.outputs[key]) return
          node.addOutput(key, createOutput(key))
          if (socket) node.outputs[key]!.socket = socket()
          onAdd(node, key, node.outputs[key] as any)
        })
      }
    }
  }
}

export function mergeSiblingNodes<ASTNode extends ASTNodeBase, S extends ClassicSchemes>(source: S['Node'], target: S['Node']) {
  return async (context: Context<ASTNode, S>) => {
    const { editor, createConnection } = context

    if (!editor.getConnections().find(c => c.source === source.id && c.target === target.id)) throw new Error('the nodes should be siblings')

    target.data = { ...source.data }

    const inputs = Object.entries(source.inputs)
    const outputs = Object.entries(source.outputs)
    const inputConnections = editor.getConnections().filter(c => c.target === source.id)
    const outputConnections = editor.getConnections().filter(c => c.source === source.id)

    await removeNodeWithConnections(editor, source.id)

    inputs.forEach(([key, input]) => input && !target.hasInput(key) && target.addInput(key, input))
    outputs.forEach(([key, output]) => output && !target.hasOutput(key) && target.addOutput(key, output))

    for (const connection of inputConnections) {
      const { source, sourceOutput, targetInput } = connection

      await editor.addConnection(createConnection(editor.getNode(source), sourceOutput, target, targetInput, connection))
    }
    for (const connection of outputConnections) {
      const { target: targetId, sourceOutput, targetInput } = connection

      await editor.addConnection(createConnection(target, sourceOutput, editor.getNode(targetId), targetInput, connection))
    }
  }
}

export function getUpdateOperator(label: string) {
  switch (label) {
    case 'increment': return '++'
    case 'decrement': return '--'
  }
  return null
}

export function getBinaryOperator(label: string) {
  switch (label) {
    case 'equal': return '=='
    case 'strict equal': return '==='
    case 'not equal': return '!='
    case 'not strict equal': return '!=='
  }
  return null
}

export function getLogicalOperator(label: string) {
  switch (label) {
    case 'and': return '&&'
    case 'or': return '||'
  }
  return null
}

export function getUnaryOperator(label: string) {
  switch (label) {
    case 'not': return '!'
    case 'to number': return '+'
    case 'typeof': return 'typeof'
  }
  return null
}

export function humanizeOperator(operator: string | number, type: 'update' | 'binary' | 'logical' | 'unary') {
  if (type === 'update') {
    switch (operator) {
      case '++': return 'increment'
      case '--': return 'decrement'
    }
  }
  if (type === 'binary') {
    switch (operator) {
      case '==': return 'equal'
      case '===': return 'strict equal'
      case '!=': return 'not equal'
      case '!==': return 'not strict equal'
    }
  }
  if (type === 'logical') {
    switch (operator) {
      case '&&': return 'and'
      case '||': return 'or'
    }
  }
  if (type === 'unary') {
    switch (operator) {
      case '!': return 'not'
      case '+': return 'to number'
    }
  }

  return String(operator)
}
