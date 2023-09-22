export type OnlyMethods<T> = {
  [K in keyof T]-?: T[K] extends Function ? T[K] : never
};

export function requestable<T>(worker: Worker): OnlyMethods<T> {
  return new Proxy({} as OnlyMethods<T>, {
    get(_, name) {
      return (...args: any[]) => request(worker, name as string, ...args)
    },
  })
}

export function responsable<T>(object: OnlyMethods<T>) {
  listen(async (methodName, args) => {
    const method = object[methodName as keyof OnlyMethods<T>]

    if (!method) throw new Error(`Method ${methodName} not found`)
    if (typeof method !== 'function') throw new Error(`Method ${methodName} is not a function`)

    return await method(...args)
  })
}

export async function request(worker: Worker, method: string, ...args: any[]) {
  const id = Math.random()

  return new Promise((resolve, reject) => {
    const listen = (event: MessageEvent<{ return: any[], id: number }>) => {
      if (event.data.id === id) {
        worker.removeEventListener('message', listen)

        resolve(event.data.return)
        clearTimeout(timer)
      }
    }
    // fail on timeout
    const timer = setTimeout(() => {
      worker.removeEventListener('message', listen)
      reject(new Error('timeout'))
    }, 5000)
    worker.postMessage({ args, method, id })
    worker.addEventListener('message', listen)
    worker.addEventListener('error', reject)
  })
}


export async function listen(handler: (method: string, args: any[]) => Promise<any>) {
  self.addEventListener('message', async (event: MessageEvent<{ args: any[], method: string, id: number }>) => {
    const { method, args, id } = event.data

    try {
      const result = await handler(method, args)

      self.postMessage({ return: result, id })
    } catch (error) {
      self.postMessage({ error: (error as Error).message, id })
    }
  })
}
