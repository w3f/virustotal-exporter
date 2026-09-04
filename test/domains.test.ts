import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveDomains } from '../src/domains.js';
import { capturingLogger } from './helpers.js';

test('union of zones and configured domains, de-duplicated', async () => {
  const domains = await resolveDomains(
    {
      cloudflareApiToken: 't',
      configured: ['b.org', 'A.org'],
      listZones: async () => ['a.org', 'c.org'],
      log: capturingLogger().log,
    },
    undefined,
  );
  assert.deepEqual(domains, ['a.org', 'c.org', 'b.org']);
});

test('without a Cloudflare token only the configured list is watched', async () => {
  let called = false;
  const listZones = async () => {
    called = true;
    return ['zone.org'];
  };
  const domains = await resolveDomains(
    { cloudflareApiToken: undefined, configured: ['a.org'], listZones, log: capturingLogger().log },
    undefined,
  );
  assert.deepEqual(domains, ['a.org']);
  assert.equal(called, false);
});

test('an enumeration failure is fatal at first and falls back to the previous set later', async () => {
  const { log, lines } = capturingLogger();
  const failing = {
    cloudflareApiToken: 't',
    configured: [],
    listZones: async () => {
      throw new Error('boom');
    },
    log,
  };

  await assert.rejects(resolveDomains(failing, undefined), /Cloudflare zone enumeration failed/);
  assert.deepEqual(await resolveDomains(failing, ['a.org']), ['a.org']);
  assert.equal(lines.filter((l) => l.level === 'error').length, 1);
});

test('an empty set is fatal', async () => {
  await assert.rejects(
    resolveDomains(
      {
        cloudflareApiToken: undefined,
        configured: [],
        listZones: async () => [],
        log: capturingLogger().log,
      },
      undefined,
    ),
    /no domains to watch/,
  );
});
