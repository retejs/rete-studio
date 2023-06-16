const nodeCrypto = require('crypto')

// eslint-disable-next-line no-undef
Object.defineProperty(globalThis, 'crypto', {
  value: {
    getRandomValues: function (buffer: any) {
      return nodeCrypto.randomFillSync(buffer)
    }
  }
})
