// Checks file responsibility headers and TSDoc at first-party exported declaration boundaries.
import type { SourceFile } from './source.ts';
import {
  readSourceFiles,
  reportViolations,
} from './source.ts';

/** Reports missing file responsibility or exported declaration documentation. */
export const collectCommentViolations = ({ path, text }: SourceFile): string[] => {
  const violations: string[] = [];
  if (!text.trimStart().startsWith('//') && !text.trimStart().startsWith('/*')) {
    violations.push(`${path}: add a file responsibility header`);
  }
  const declarations = text.matchAll(/^export\s+(?:const|type|class|interface|enum|function)\s+(\w+)/gm);
  for (const declaration of declarations) {
    const preceding = text.slice(0, declaration.index).trimEnd();
    if (!/\/\*\*[\s\S]*?\*\/$/.test(preceding.slice(preceding.lastIndexOf('/**')))) {
      violations.push(`${path}: exported ${declaration[1]} needs TSDoc`);
    }
  }

  return violations;
};

if (import.meta.main) {
  reportViolations('comments', (await readSourceFiles()).flatMap(collectCommentViolations));
}
