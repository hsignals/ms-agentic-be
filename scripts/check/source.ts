// Shares repository-owned TypeScript inputs and diagnostic output between boundary checks.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** One maintained production module and its source. */
export type SourceFile = { path: string, text: string };

/** Reads production modules; test helpers and generated migration metadata remain with their owners. */
export const readSourceFiles = async (): Promise<SourceFile[]> => {
  const paths = await Array.fromAsync(new Bun.Glob('src/**/*.ts').scan({ cwd: process.cwd() }));

  return paths.filter(path => !path.endsWith('.test.ts') && !path.endsWith('.d.ts')).toSorted().map(path => ({
    path,
    text: readFileSync(resolve(path), 'utf8'),
  }));
};

/** Prints every diagnostic and preserves failure for callers and CI. */
export const reportViolations = (name: string, violations: readonly string[]): void => {
  for (const violation of violations) {
    console.error(violation);
  }
  if (violations.length > 0) {
    process.exitCode = 1;
  } else {
    console.log(`${name}: passed`);
  }
};
