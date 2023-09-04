import babelEnv from '@babel/preset-env'
import babelReact from '@babel/preset-react'
import babelTS from '@babel/preset-typescript'
import commonjs from '@rollup/plugin-commonjs'
import { ReteOptions } from 'rete-cli'
import copy from 'rollup-plugin-copy'

export default <ReteOptions>{
  input: 'src/index.ts',
  name: 'ReteStudioUI',
  globals: {
    'rete': 'Rete',
    'rete-area-plugin': 'ReteAreaPlugin',
    'rete-react-plugin': 'ReteReactPlugin',
    'rete-context-menu-plugin': 'ReteContextMenuPlugin',
    'rete-connection-plugin': 'ReteConnectionPlugin',
    'rete-history-plugin': 'ReteHistoryPlugin',
    'rete-scopes-plugin': 'ReteScopesPlugin',
    'rete-structures': 'ReteStructures',
    'styled-components': 'styled',
    '@monaco-editor/react': 'MonacoEditorReact',
    'elkjs': 'elkjs',
    'react': 'React',
    'antd': 'Antd',
    'monaco-editor': 'MonacoEditor',
    'rete-studio-core': 'ReteStudioCore',
    'usehooks-ts': 'UseHooksTS',
  },
  plugins: [
    commonjs(),
    copy({
      targets: [
        { src: 'src/styles.css', dest: 'dist' }
      ]
    })
  ],
  babel: {
    presets: [
      babelEnv,
      babelTS,
      babelReact
    ]
  }
}
