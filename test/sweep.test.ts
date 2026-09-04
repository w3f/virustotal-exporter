import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createMetrics } from '../src/metrics.js';
import { createSweeper, type SweeperOptions } from '../src/sweep.js';
import { capturingLogger } from './helpers.js';

function sweeperWith(overrides: Partial<SweeperOptions>) {
  const { log, lines } = capturingLogger();
  const metrics = createMetrics();
  const sweeper = createSweeper({
    source: {
      cloudflareApiToken: undefined,
      configured: ['a.org', 'b.org', 'c.org'],
      listZones: async () => [],
      log,
    },
    metrics,
    log,
    lookupReports: async () => 0,
    lookupSpacingMs: 0,
    now: () => 5_000,
    ...overrides,
  });
  return { sweeper, metrics, lines };
}

test('one failing lookup neither stops the sweep nor publishes a value', async () => {
  const { sweeper, metrics, lines } = sweeperWith({
    lookupReports: async (domain) => {
      if (domain === 'b.org') throw new Error('HTTP 500');
      return 1;
    },
  });
  await sweeper.tick();

  const exposition = await metrics.registry.metrics();
  assert.match(exposition, /virustotal_reports\{domain="a.org"\} 1/);
  assert.match(exposition, /virustotal_reports\{domain="c.org"\} 1/);
  assert.match(exposition, /virustotal_last_success_timestamp_seconds\{domain="c.org"\} 5/);
  assert.doesNotMatch(exposition, /domain="b.org"/);
  assert.ok(lines.some((l) => l.level === 'warn' && l.msg === 'lookup failed'));
});

test('a sweep that is still running is not overlapped', async () => {
  let release!: () => void;
  const blocked = new Promise<number>((resolve) => (release = () => resolve(0)));
  let lookups = 0;
  const { sweeper, lines } = sweeperWith({
    lookupReports: () => {
      lookups++;
      return blocked;
    },
  });

  const first = sweeper.tick();
  await sweeper.tick();
  assert.ok(lines.some((l) => l.level === 'warn' && l.msg.includes('skipping')));
  release();
  await first;
  assert.equal(lookups, 3);
});

test('a first-sweep enumeration failure is fatal', async () => {
  const { sweeper } = sweeperWith({
    source: {
      cloudflareApiToken: 't',
      configured: [],
      listZones: async () => {
        throw new Error('down');
      },
      log: capturingLogger().log,
    },
  });
  await assert.rejects(sweeper.tick(), /enumeration failed/);
});
