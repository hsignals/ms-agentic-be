// Shutdown proof must reject stale, partial, and missing Cloud Monitoring observations.
import { spawnSync } from 'node:child_process';
import {
  expect,
  test,
} from 'vitest';

const cutoff = '2026-11-01T00:02:00Z';
const point = (count: string, startTime = '2026-11-01T00:03:00Z') => ({
  interval: { startTime, endTime: '2026-11-01T00:04:00Z' },
  value: { int64Value: count },
});
const hasZeroProof = (input: unknown): boolean => {
  const result = spawnSync('jq', [
    '-e',
    '--arg',
    'cutoff',
    cutoff,
    '--from-file',
    new URL('./zero-instances.jq', import.meta.url).pathname,
  ], { input: JSON.stringify(input), encoding: 'utf8' });
  return result.status === 0;
};

test('accepts explicit fresh zero samples across every observed instance series', () => {
  expect(hasZeroProof({ timeSeries: [{ points: [point('0')] }, { points: [point('0')] }] })).toBe(true);
});

test('rejects missing, stale, nonzero, and incomplete observations', () => {
  expect(hasZeroProof({})).toBe(false);
  expect(hasZeroProof({ timeSeries: [] })).toBe(false);
  expect(hasZeroProof({ timeSeries: [{ points: [point('0', cutoff)] }] })).toBe(false);
  expect(hasZeroProof({ timeSeries: [{ points: [point('1')] }] })).toBe(false);
  expect(hasZeroProof({ timeSeries: [{ points: [point('0')] }, { points: [point('1', cutoff)] }] })).toBe(false);
  expect(hasZeroProof({ timeSeries: [{ points: [point('0')] }], nextPageToken: 'unread' })).toBe(false);
});
