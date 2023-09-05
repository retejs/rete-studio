import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'process.env.JS_EXAMPLES': JSON.stringify('[]')
  },
  // resolve: {
  //   alias: [
  //     {
  //       find: "antd/lib",
  //       replacement: "antd/es",
  //     }
  //   ],
  // },
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    })
  ],
})
