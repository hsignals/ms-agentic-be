// Enforces the scaffold's production, HTTP, and process-entrypoint import boundaries.
import { posix } from 'node:path';
import {
  readSourceFiles,
  reportViolations,
} from './source.ts';

/** One production module's native Bun-parsed imports. */
export type ModuleImports = { path: string, imports: readonly string[] };

/** Finds disallowed dependencies while preserving native vendor imports. */
export const collectImportViolations = ({ path, imports }: ModuleImports): string[] => {
  const violations: string[] = [];
  for (const specifier of imports) {
    const target = specifier.startsWith('@/')
      ? `src/${specifier.slice(2)}`
      : posix.normalize(posix.join(posix.dirname(path), specifier));
    if ((specifier === 'hono' || specifier.startsWith('hono/')) && !path.startsWith('src/http/')) {
      violations.push(`${path}: HTTP imports belong under src/http/`);
    }
    if (!specifier.startsWith('.') && !specifier.startsWith('@/')) {
      continue;
    }
    if (!target.startsWith('src/') || target.includes('/tests/') || /\.(?:test|spec)\.ts$/.test(target)) {
      violations.push(`${path}: production cannot import ${specifier}`);
    }
    if (
      ['src/index', 'src/index.ts', 'src/worker', 'src/worker.ts', 'src/db/migrate', 'src/db/migrate.ts'].includes(
        target,
      )
    ) {
      violations.push(`${path}: production cannot import process entrypoint ${specifier}`);
    }
    if (!path.startsWith('src/http/') && path !== 'src/index.ts' && target.startsWith('src/http/')) {
      violations.push(`${path}: application logic cannot import the HTTP layer ${specifier}`);
    }
  }

  return violations;
};

if (import.meta.main) {
  const transpiler = new Bun.Transpiler({ loader: 'ts' });
  const files = await readSourceFiles();
  const violations = files.flatMap(file =>
    collectImportViolations({
      path: file.path,
      imports: transpiler.scan(file.text).imports.map(item => item.path),
    })
  );
  reportViolations('imports', violations);
}
