import { ClassicPreset } from 'rete'

export class Socket extends ClassicPreset.Socket {

  clone() {
    return new Socket(this.name)
  }

  serialize(): JSONSocket {
    return {
      name: this.name
    }
  }

  static deserialize(data: JSONSocket) {
    return new Socket(data.name)
  }
}

export type JSONSocket = {
  name: string
}


export class RefSocket extends Socket {
  isRef = true
  constructor(public name: string, public identifier?: string) {
    super(name)
  }

  clone() {
    return new RefSocket(this.name, this.identifier)
  }

  serialize(): JSONRefSocket {
    return {
      ...super.serialize(),
      isRef: true,
      identifier: this.identifier
    }
  }

  static deserialize(data: JSONRefSocket) {
    const socket = new RefSocket(data.name)

    socket.identifier = data.identifier

    return socket
  }
}

export type JSONRefSocket = JSONSocket & {
  isRef: true
  identifier?: string
}

export class ControlSocket extends Socket {
  isControl = true

  clone() {
    return new ControlSocket(this.name)
  }

  serialize(): JSONControlSocket {
    return {
      ...super.serialize(),
      isControl: true
    }
  }

  static deserialize(data: JSONControlSocket) {
    const socket = new ControlSocket(data.name)

    return socket
  }
}

export type JSONControlSocket = JSONSocket & {
  isControl: true
}


export const socket = new Socket('any')
