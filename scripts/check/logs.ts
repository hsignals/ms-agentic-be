// Prevents unstructured production logs and direct logging of private request/provider data.
import type { SourceFile } from './source.ts';
import {
  readSourceFiles,
  reportViolations,
} from './source.ts';

/** Reports concrete logging patterns that bypass the safe structured logger boundary. */
export const collectLogViolations = ({ path, text }: SourceFile): string[] => {
  const violations: string[] = [];
  if (/\bconsole\s*\./.test(text)) {
    violations.push(`${path}: production logging must use the shared Pino logger`);
  }
  if (
    path !== 'src/logger.ts'
    && /\b(?:logger|\w+Logger)\.(?:trace|debug|info|warn|error|fatal)\(\s*(?:error|err|cause|prompt|input|request)\s*[,)]/
      .test(text)
  ) {
    violations.push(`${path}: log structured safe fields instead of raw exceptions or private inputs`);
  }
  if (
    path !== 'src/logger.ts'
    && /\b(?:logger|\w+Logger)\.(?:trace|debug|info|warn|error|fatal)\(\s*\{[^}]*\b(?:authorization|password|apiKey|openaiApiKey|e2bApiKey|stagingAuthToken|prompt)\s*[:},]/
      .test(text)
  ) {
    violations.push(`${path}: private values cannot be log fields`);
  }

  return violations;
};

if (import.meta.main) {
  reportViolations('logs', (await readSourceFiles()).flatMap(collectLogViolations));
}
