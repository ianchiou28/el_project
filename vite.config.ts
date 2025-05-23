import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  // 添加下面这些配置来支持Tauri
  server: {
    port: 5173,
    strictPort: true,
  },
  // 为生产环境构建配置
  build: {
    // Tauri使用Rollup，因此我们需要确保不将输出分割得太细
    target: ['es2021', 'chrome100', 'safari13'],
    // 不要压缩代码，Tauri会处理这个
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    // 为调试构建生成源代码映射
    sourcemap: !!process.env.TAURI_DEBUG
  }
})