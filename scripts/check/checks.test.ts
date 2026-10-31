// Verifies policy checks reject their concrete boundary violations without importing production modules.
import {
  describe,
  expect,
  it,
} from 'vitest';
import { collectCommentViolations } from './comments.ts';
import { collectImportViolations } from './imports.ts';
import { collectLogViolations } from './logs.ts';
import { collectNamingViolations } from './names.ts';

describe('repository policy checks', () => {
  it('rejects production imports of test helpers and process entrypoints', () => {
    expect(
      collectImportViolations({
        path: 'src/runtime/run.ts',
        imports: ['../../tests/fixture', '../index', '../http/app', 'hono'],
      }),
    ).toHaveLength(4);
    expect(collectImportViolations({ path: 'src/http/app.ts', imports: ['../runtime/run', 'hono'] })).toEqual([]);
  });
  it('rejects schema aliases and boolean names while allowing native field names', () => {
    expect(
      collectNamingViolations({
        path: 'src/config.ts',
        text: 'const inputSchema = z.object({});\nconst load = (): boolean => true;',
      }),
    ).toHaveLength(2);
    expect(
      collectNamingViolations({
        path: 'src/config.ts',
        text: 'const InputSchema = z.object({});\nconst canRead = (): boolean => true;',
      }),
    ).toEqual([]);
  });
  it('rejects raw logs and private fields', () => {
    expect(collectLogViolations({ path: 'src/runtime/run.ts', text: 'console.log(input); logger.error(cause);' }))
      .toHaveLength(2);
    expect(collectLogViolations({ path: 'src/runtime/run.ts', text: 'logger.info({ prompt: input.prompt });' }))
      .toHaveLength(1);
    expect(collectLogViolations({ path: 'src/runtime/run.ts', text: "logger.info({ event: 'run.started', runId });" }))
      .toEqual([]);
  });
  it('requires headers and exported TSDoc without accepting a prior declaration comment', () => {
    expect(collectCommentViolations({ path: 'src/run.ts', text: 'export type Run = {};' })).toHaveLength(2);
    expect(
      collectCommentViolations({
        path: 'src/run.ts',
        text: '// Owns runs.\n/** One run. */\nexport type Run = {};\nexport const id = 1;',
      }),
    ).toHaveLength(1);
  });
});
