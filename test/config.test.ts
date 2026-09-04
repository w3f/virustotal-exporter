import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadConfig } from '../src/config.js';

test('defaults with only the API key set', () => {
  const config = loadConfig({ VIRUSTOTAL_API_KEY: 'k' });
  assert.deepEqual(config, {
    virustotalApiKey: 'k',
    cloudflareApiToken: undefined,
    domains: [],
    intervalMinutes: 480,
    logLevel: 'info',
  });
});

test('parses the domain list and interval', () => {
  const config = loadConfig({
    VIRUSTOTAL_API_KEY: 'k',
    CLOUDFLARE_API_TOKEN: 't',
    DOMAINS: ' Example.org, example.com ,,',
    INTERVAL_MINUTES: '30',
    LOG_LEVEL: 'debug',
  });
  assert.equal(config.cloudflareApiToken, 't');
  assert.deepEqual(config.domains, ['example.org', 'example.com']);
  assert.equal(config.intervalMinutes, 30);
  assert.equal(config.logLevel, 'debug');
});

test('rejects invalid values naming the variable', () => {
  assert.throws(() => loadConfig({}), /VIRUSTOTAL_API_KEY/);
  assert.throws(
    () => loadConfig({ VIRUSTOTAL_API_KEY: 'k', INTERVAL_MINUTES: 'soon' }),
    /INTERVAL_MINUTES/,
  );
  assert.throws(() => loadConfig({ VIRUSTOTAL_API_KEY: 'k', LOG_LEVEL: 'loud' }), /LOG_LEVEL/);
});
