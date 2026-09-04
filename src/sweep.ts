import { setTimeout as sleep } from 'node:timers/promises';
import { resolveDomains, type DomainSource } from './domains.js';
import { errorFields, type Logger } from './log.js';
import type { Metrics } from './metrics.js';

export const LOOKUP_SPACING_MS = 15_000;

export interface SweeperOptions {
  source: DomainSource;
  metrics: Metrics;
  log: Logger;
  lookupReports(domain: string): Promise<number>;
  lookupSpacingMs?: number;
  now?(): number;
}

export interface Sweeper {
  // Runs one full sweep, or skips it when the previous one is still running.
  // Rejects only on fatal conditions: the first enumeration failing or an empty domain set.
  tick(): Promise<void>;
}

export function createSweeper(options: SweeperOptions): Sweeper {
  const { source, metrics, log, lookupReports } = options;
  const spacingMs = options.lookupSpacingMs ?? LOOKUP_SPACING_MS;
  const now = options.now ?? Date.now;
  let domains: string[] | undefined;
  let running = false;

  async function sweep(): Promise<void> {
    domains = await resolveDomains(source, domains);
    log.info('sweep started', { domains: domains.length });
    let failed = 0;
    for (const [index, domain] of domains.entries()) {
      if (index > 0) await sleep(spacingMs);
      try {
        const reports = await lookupReports(domain);
        metrics.recordSuccess(domain, reports, Math.floor(now() / 1000));
        log.debug('lookup succeeded', { domain, reports });
      } catch (err) {
        failed++;
        log.warn('lookup failed', { domain, ...errorFields(err) });
      }
    }
    metrics.keepOnly(domains);
    log.info('sweep finished', { domains: domains.length, failed });
  }

  return {
    async tick() {
      if (running) {
        log.warn('previous sweep still running, skipping this one');
        return;
      }
      running = true;
      try {
        await sweep();
      } finally {
        running = false;
      }
    },
  };
}
