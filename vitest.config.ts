// Keeps unit, disposable local integration, and container suites separate.
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  envDir: false,
  resolve: { alias: { '@': resolve(import.meta.dirname, 'src') } },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts', 'src/**/*.test.ts', 'scripts/**/*.test.ts'],
          testTimeout: 10_000,
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          pool: 'forks',
          maxWorkers: 1,
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 30_000,
        },
      },
      {
        extends: true,
        test: {
          name: 'container',
          include: ['tests/container/**/*.test.ts'],
          pool: 'forks',
          maxWorkers: 1,
          fileParallelism: false,
          testTimeout: 45_000,
          hookTimeout: 120_000,
        },
      },
    ],
  },
});
