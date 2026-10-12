import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: [
        // Declaration files carry no runtime code (includes the generated src/api/schema.d.ts).
        'src/**/*.d.ts',
        // Bootstrap: mounts the app into the DOM, covered by the Playwright smoke suite.
        'src/main.ts',
        // Test files and helpers are not product code.
        'src/**/*.test.ts',
      ],
      reporter: ['text-summary', 'text', 'html'],
      thresholds: { lines: 90, functions: 90, statements: 90, branches: 90 },
    },
  },
})
