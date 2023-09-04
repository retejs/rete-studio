import babelEnv from '@babel/preset-env'
import babelTS from '@babel/preset-typescript'
import { ReteOptions } from 'rete-cli'

export default <ReteOptions>{
  input: 'src/index.ts',
  name: 'ReteStudioCore',
  globals: {
    'rete': 'Rete',
    'rete-area-plugin': 'ReteAreaPlugin',
    'rete-structures': 'ReteStructures',
    '@babel/types': 'BabelType',
    '@babel/parser': 'BabelParser',
    '@babel/generator': 'BabelGenerator',
    '@babel/traverse': 'BabelTraverse',
  },
  babel: {
    presets: [
      babelEnv,
      babelTS
    ]
  }
}
