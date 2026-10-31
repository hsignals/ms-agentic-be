// Checks deterministic first-party schema and boolean-function naming without importing sibling domains.
import type { SourceFile } from './source.ts';
import {
  readSourceFiles,
  reportViolations,
} from './source.ts';

/** Reports declarations whose spelling conflicts with the repository's chosen naming contract. */
export const collectNamingViolations = ({ path, text }: SourceFile): string[] => {
  const violations: string[] = [];
  for (const match of text.matchAll(/^\s*(?:export\s+)?const\s+([a-z][A-Za-z0-9]*Schema)\s*=/gm)) {
    violations.push(`${path}: schema ${match[1]} must use PascalCase`);
  }
  for (
    const match of text.matchAll(/^\s*(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\([^;]*?\)\s*:\s*boolean\s*=>/gm)
  ) {
    if (!/^(?:is|are|has|can|should|needs|requires|matches|equals|supports|meets|exceeds)[A-Z]/.test(match[1] ?? '')) {
      violations.push(`${path}: boolean function ${match[1]} must read as a question`);
    }
  }

  return violations;
};

if (import.meta.main) {
  reportViolations('names', (await readSourceFiles()).flatMap(collectNamingViolations));
}
