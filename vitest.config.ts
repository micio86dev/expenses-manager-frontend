import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
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
  }),
)
