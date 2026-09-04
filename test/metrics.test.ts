import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createMetrics } from '../src/metrics.js';

test('series for domains that left the set are removed', async () => {
  const metrics = createMetrics();
  metrics.recordSuccess('a.org', 2, 1000);
  metrics.recordSuccess('b.org', 0, 1000);
  metrics.keepOnly(['a.org']);

  const exposition = await metrics.registry.metrics();
  assert.match(exposition, /virustotal_reports\{domain="a.org"\} 2/);
  assert.match(exposition, /virustotal_last_success_timestamp_seconds\{domain="a.org"\} 1000/);
  assert.doesNotMatch(exposition, /domain="b.org"/);
});
