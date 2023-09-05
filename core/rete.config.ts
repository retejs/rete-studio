import { ReteOptions } from 'rete-cli'

export default <ReteOptions>{
  input: 'src/index.ts',
  name: 'ReteStudioCore',
  globals: {
    'rete': 'Rete',
    'rete-area-plugin': 'ReteAreaPlugin',
    'rete-structures': 'ReteStructures'
  }
}
