import { NodeEditor } from 'rete'

import { Connection, JSONConnection } from './connections'
import { InputControl, InsertControl, JSONControl, JSONInputControl, JSONInsertControl, JSONSelectControl, SelectControl } from './controls'
import { BaseNode, Input, JSONBaseNode, Output } from './nodes'
import { ControlSocket, JSONControlSocket, JSONRefSocket, JSONSocket, RefSocket, Socket } from './sockets'
import { Schemes } from './types'

export type JSONEditorData = {
  nodes: JSONBaseNode[],
  connections: JSONConnection[]
}

export function serialize(editor: NodeEditor<Schemes>): JSONEditorData {
  const data = {
    nodes: editor.getNodes().map(n => n.serialize()),
    connections: editor.getConnections().map(c => c.serialize()),
  }

  return data
}

function deserializeSocket(socket: JSONRefSocket | JSONControlSocket | JSONSocket) {
  if ('isRef' in socket) {
    return RefSocket.deserialize(socket)
  }
  if ('isControl' in socket) {
    return ControlSocket.deserialize(socket)
  }
  return Socket.deserialize(socket)
}

function deserializeControl(control: JSONControl | JSONInsertControl | JSONInputControl | JSONSelectControl) {
  if ('isSelectControl' in control) {
    return SelectControl.deserialize(control)
  }
  if ('isInputControl' in control) {
    return InputControl.deserialize(control)
  }
  if ('isInsertControl' in control) {
    return InsertControl.deserialize(control)
  }
  throw new Error('cannot find control class')
}

async function importForParent(editor: NodeEditor<Schemes>, nodes: JSONBaseNode[], parent?: string) {
  const children = nodes.filter(node => node.parent === parent)
  for (const node of children) {
    await editor.addNode(BaseNode.deserialize(
      node,
      input => {
        return Input.deserialize(input, deserializeSocket(input.socket), input.control && deserializeControl(input.control))
      },
      output => {
        return Output.deserialize(output, deserializeSocket(output.socket), output.control && deserializeControl(output.control))
      },
      control => {
        return deserializeControl(control)
      }
    ))
    await importForParent(editor, nodes, node.id)
  }
}

export async function deserialize(editor: NodeEditor<Schemes>, data: JSONEditorData) {
  await importForParent(editor, data.nodes)

  for (const c of data.connections) {
    const source = editor.getNode(c.source)
    const target = editor.getNode(c.target)
    if (!source || !target) continue
    const instance = Connection.deserialize(c, source, target)

    await editor.addConnection(instance)
  }
}
