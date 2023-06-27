/* eslint-disable @typescript-eslint/ban-ts-comment */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
// @ts-ignore
import { loadExamples } from './src/rete/languages/javascript/tests/utils'
import { VitePluginRadar } from 'vite-plugin-radar'
import htmlPlugin from 'vite-plugin-html-config'
// @ts-ignore
import { tokens } from './src/theme'

const title = 'Rete Studio - Code generation tool powered by Rete.js'
const description = 'Experience seamless transformation of JavaScript into a visual programming language and harness code generation capabilities with Rete Studio'
const keywords = 'rete.js, codegen, code generation, visual programming, vpl, visual programming language, js, javascript'
const themeColor = tokens.colorBgBase
const cover = 'https://studio.retejs.org/codegen.png'

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    EXAMPLES: JSON.stringify(loadExamples())
  },
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
    VitePluginRadar({
      analytics: {
        id: 'G-F46GVM1665',
      },
    }),
    htmlPlugin({
      title,
      metas: [
        {
          name: 'description',
          content: description,
        },
        {
          name: 'keywords',
          content: keywords,
        },
        {
          name: 'theme-color',
          content: themeColor,
        },
        {
          name: 'twitter:card',
          content: 'summary_large_image',
        },
        {
          name: 'twitter:site',
          content: '@rete_js',
        },
        {
          name: 'twitter:creator',
          content: '@rete_js',
        },
        {
          name: 'twitter:title',
          content: title,
        },
        {
          name: 'twitter:description',
          content: description,
        },
        {
          name: 'twitter:image',
          content: cover,
        },
        {
          name: 'og:title',
          content: title,
        },
        {
          name: 'og:description',
          content: description,
        },
        {
          name: 'og:image',
          content: cover,
        },
        {
          name: 'og:locale',
          content: 'en_US',
        }
      ]
    })
  ],
})
