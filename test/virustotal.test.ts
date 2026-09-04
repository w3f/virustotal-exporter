import assert from 'node:assert/strict';
import { test } from 'node:test';
import { lookupReports } from '../src/virustotal.js';
import { fetchReturning, jsonResponse } from './helpers.js';

const report = (stats: Record<string, unknown>) =>
  jsonResponse({
    data: { id: 'example.org', type: 'domain', attributes: { last_analysis_stats: stats } },
  });

test('counts malicious and suspicious vendors', async () => {
  const fetchFn = fetchReturning(
    report({ harmless: 60, malicious: 2, suspicious: 1, undetected: 30, timeout: 0 }),
  );
  assert.equal(await lookupReports('key', 'example.org', fetchFn), 3);
});

test('a domain VirusTotal has never analysed counts as 0', async () => {
  assert.equal(
    await lookupReports('key', 'example.org', fetchReturning(new Response('', { status: 404 }))),
    0,
  );
});

test('a malformed body or an error status is a failure', async () => {
  await assert.rejects(
    lookupReports('key', 'example.org', fetchReturning(report({ harmless: 1 }))),
    /malformed/,
  );
  await assert.rejects(
    lookupReports('key', 'example.org', fetchReturning(jsonResponse({}, 429))),
    /HTTP 429/,
  );
});
