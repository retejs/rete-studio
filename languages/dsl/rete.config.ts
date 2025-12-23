import { ReteOptions } from 'rete-cli'
import commonjs from '@rollup/plugin-commonjs'

export default <ReteOptions>{
  input: 'src/index.ts',
  name: 'ReteStudioDSLLang',
  plugins: [
    commonjs()
  ],
  globals: {
    'rete': 'Rete',
    'rete-area-plugin': 'ReteAreaPlugin',
    'rete-studio-core': 'ReteStudioCore'
  }
}
