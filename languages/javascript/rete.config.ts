import { ReteOptions } from 'rete-cli'

export default <ReteOptions>{
  input: 'src/index.ts',
  name: 'ReteStudioJavaScriptLang',
  globals: {
    'rete': 'Rete',
    'rete-area-plugin': 'ReteAreaPlugin',
    'rete-structures': 'ReteStructures',
    '@babel/types': 'BabelType',
    '@babel/parser': 'BabelParser',
    '@babel/generator': 'BabelGenerator',
    '@babel/traverse': 'BabelTraverse',
    'rete-studio-core': 'ReteStudioCore'
  }
}
