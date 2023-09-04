import { ClassicPreset } from 'rete'

export class Socket extends ClassicPreset.Socket {

  clone() {
    return new Socket(this.name)
  }
}


export const socket = new Socket('any')
