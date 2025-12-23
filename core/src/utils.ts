import { ClassicPreset, NodeEditor, NodeId } from 'rete'

import { Socket } from './sockets'
import { ClassicSchemes } from './types'

export async function copyToEditor<S extends ClassicSchemes>(from: NodeEditor<S>, to: NodeEditor<S>) {
  async function addNodes(parent?: string) {
    for (const node of from.getNodes().filter(n => n.parent === parent)) {
      // console.time('addNode')
      await to.addNode(node.clone(true))
      // console.timeEnd('addNode')
      await addNodes(node.id)
    }
  }
  await addNodes()
  for (const n of from.getConnections()) {
    // console.time('addConnection')
    await to.addConnection(n)
    // console.timeEnd('addConnection')
  }
}

export type MirrorIgnore<S extends ClassicSchemes> = (node: S['Node'], key: string, side: 'input' | 'output') => boolean | null
export type MirrorContext<S extends ClassicSchemes> = {
  ignore: MirrorIgnore<S>,
  createInput: (label?: string) => ClassicPreset.Input<Socket>
  createOutput: (label?: string) => ClassicPreset.Output<Socket>
  createConnection: (source: S['Node'], sourceOutput: string, target: S['Node'], targetInput: string) => S['Connection']
}

export function mirrorPorts<S extends ClassicSchemes>(editor: NodeEditor<S>, nodeId: string, context: MirrorContext<S>): () => void {
  const { ignore } = context
  const node = editor.getNode(nodeId)
  if (!node) return () => { /* no-op */ }
  const inputs = { ...node.inputs }
  const outputs = { ...node.outputs }
  const newInputs: string[] = []
  const newOutputs: string[] = []

  for (const key in inputs) {
    if (ignore(node, key, 'input')) continue
    const input = inputs[key]

    if (input && !outputs[key]) {
      node.addOutput(key, context.createOutput(input.label))
      newOutputs.push(key)
    }
  }
  for (const key in outputs) {
    if (ignore(node, key, 'output')) continue
    const output = outputs[key]

    if (output && !inputs[key]) {
      node.addInput(key, context.createInput(output.label))
      newInputs.push(key)
    }
  }

  return () => {
    for (const key of newOutputs) {
      node.removeInput(key)
    }

    for (const key of newInputs) {
      node.removeOutput(key)
    }
  }
}

export async function mirrorIncomers<S extends ClassicSchemes>(editor: NodeEditor<S>, nodeId: string, context: MirrorContext<S>) {
  const { ignore } = context
  const inpCons = editor.getConnections().filter(c => c.target === nodeId)

  const clear = mirrorPorts(editor, nodeId, context)

  for (const c of inpCons) {
    const targetNode = editor.getNode(nodeId)
    if (ignore && targetNode && ignore(targetNode, c.targetInput, 'input')) continue
    await mirrorIncomers(editor, c.source, context)
    await editor.removeConnection(c.id)
    const target = editor.getNode(c.target)
    const source = editor.getNode(c.source)
    if (target && source) {
      await editor.addConnection(context.createConnection(target, c.targetInput, source, c.sourceOutput))
    }
  }
  clear()
}

export async function mirrorInput<S extends ClassicSchemes>(editor: NodeEditor<S>, match: (nodeId: string, input: string) => boolean, context: MirrorContext<S>) {
  const cons = editor.getConnections().filter(c => match(c.target, c.targetInput))

  for (const con of cons) {
    const node = editor.getNode(con.target)
    if (!node) continue

    await mirrorIncomers(editor, con.source, context)

    con && await editor.removeConnection(con.id)
    node.removeInput(con.targetInput)
    node.addOutput(con.targetInput, context.createOutput(con.targetInput))
    const source = editor.getNode(con.source)
    if (source) {
      await editor.addConnection(context.createConnection(node, con.targetInput, source, con.sourceOutput))
    }
  }
}

export async function mirrorOutgoers<S extends ClassicSchemes>(editor: NodeEditor<S>, nodeId: string, context: MirrorContext<S>) {
  const { ignore } = context
  const inpCons = editor.getConnections().filter(c => c.source === nodeId)

  const clear = mirrorPorts(editor, nodeId, context)

  for (const c of inpCons) {
    const sourceNode = editor.getNode(nodeId)
    if (ignore && sourceNode && ignore(sourceNode, c.sourceOutput, 'output')) continue
    await mirrorOutgoers(editor, c.target, context)
    await editor.removeConnection(c.id)
    const target = editor.getNode(c.target)
    const source = editor.getNode(c.source)
    if (target && source) {
      await editor.addConnection(context.createConnection(target, c.targetInput, source, c.sourceOutput))
    }
  }
  clear()
}

export async function mirrorOutput<S extends ClassicSchemes>(editor: NodeEditor<S>, match: (nodeId: string, output: string) => boolean, context: MirrorContext<S>) {
  const cons = editor.getConnections().filter(c => match(c.source, c.sourceOutput))

  for (const con of cons) {
    const node = editor.getNode(con.source)
    if (!node) continue

    await mirrorOutgoers(editor, con.target, context)

    await editor.removeConnection(con.id)
    node.removeOutput(con.sourceOutput)

    node.addInput(con.sourceOutput, context.createInput(con.sourceOutput))
    const target = editor.getNode(con.target)
    if (target) {
      await editor.addConnection(context.createConnection(target, con.targetInput, node, con.sourceOutput))
    }
  }
}

export async function removeInputConnections<S extends ClassicSchemes>(editor: NodeEditor<S>, nodeId: NodeId, inputs?: string[]) {
  for (const c of editor.getConnections().filter(c => c.target === nodeId)) {
    if (inputs && !inputs.includes(c.targetInput)) continue
    await editor.removeConnection(c.id)
  }
}

export async function removeOutputConnections<S extends ClassicSchemes>(editor: NodeEditor<S>, nodeId: NodeId, outputs?: string[]) {
  for (const c of editor.getConnections().filter(c => c.source === nodeId)) {
    if (outputs && !outputs.includes(c.sourceOutput)) continue
    await editor.removeConnection(c.id)
  }
}

export async function removeNodeWithConnections(editor: NodeEditor<ClassicSchemes>, id: NodeId) {
  for (const c of [...editor.getConnections()]) {
    if (c.source === id || c.target === id) {
      await editor.removeConnection(c.id)
    }
  }

  await editor.removeNode(id)
}
