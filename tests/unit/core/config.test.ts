// Proves bootstrap defaults and safe rejection of invalid external settings.

import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  getMissingConfiguration,
  loadConfig,
} from '../../../src/config';
import { createLogger } from '../../../src/logger';

describe('configuration and logs', () => {
  it('supports safe bootstrap with no credentials', () => {
    const config = loadConfig({});
    expect(config.port).toBe(8080);
    expect(getMissingConfiguration(config)).toContain('DATABASE_URL');
    expect(getMissingConfiguration(config)).toContain('E2B_API_KEY');
  });

  it('rejects invalid configured URLs, unknown settings, and weak tokens without values', () => {
    for (
      const env of [
        { DATABASE_URL: 'SECRET' },
        { REDIS_URL: 'https://SECRET' },
        { NODE_ENV: 'SECRET' },
        { PORT: '0' },
        { STAGING_AUTH_TOKEN: 'SECRET' },
      ]
    ) {
      expect(() => loadConfig(env)).toThrow('Invalid configuration fields');
      try {
        loadConfig(env);
      } catch (error) {
        expect(String(error)).not.toContain('SECRET');
      }
    }
  });

  it('redacts credentials and records only safe exception categories', () => {
    const lines: string[] = [];
    const logger = createLogger(loadConfig({}), {
      write: chunk => {
        lines.push(String(chunk));
      },
    });
    logger.info({ token: 'SECRET', nested: { apiKey: 'SECRET' }, prompt: 'SECRET', err: new Error('SECRET') });
    expect(lines.join('')).not.toContain('SECRET');
    expect(lines.join('')).toContain('REDACTED');
  });
});
