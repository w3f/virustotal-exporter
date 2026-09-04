import assert from 'node:assert/strict';
import { test } from 'node:test';
import { listZones } from '../src/cloudflare.js';
import { fetchReturning, jsonResponse } from './helpers.js';

const page = (names: string[], totalPages: number) =>
  jsonResponse({
    success: true,
    errors: [],
    result: names.map((name) => ({ name })),
    result_info: { total_pages: totalPages },
  });

test('reads every page', async () => {
  const requested: string[] = [];
  const responses = fetchReturning(
    page(['a.org', 'b.org'], 3),
    page(['c.org'], 3),
    page(['d.org'], 3),
  );
  const fetchFn: typeof fetch = (url, init) => {
    requested.push(String(url));
    return responses(url, init);
  };

  assert.deepEqual(await listZones('token', fetchFn), ['a.org', 'b.org', 'c.org', 'd.org']);
  assert.deepEqual(
    requested.map((url) => new URL(url).searchParams.get('page')),
    ['1', '2', '3'],
  );
});

test('fails on an unsuccessful response instead of returning a partial set', async () => {
  const fetchFn = fetchReturning(
    page(['a.org'], 2),
    jsonResponse({ success: false, errors: [{ message: 'nope' }] }, 403),
  );
  await assert.rejects(listZones('token', fetchFn), /page 2: HTTP 403/);
});
