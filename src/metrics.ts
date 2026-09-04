import { Gauge, Registry, collectDefaultMetrics } from '@prometheus-io/client';

export interface Metrics {
  registry: Registry;
  recordSuccess(domain: string, reports: number, nowSeconds: number): void;
  keepOnly(domains: Iterable<string>): void;
}

export function createMetrics(): Metrics {
  const registry = new Registry();
  collectDefaultMetrics({ register: registry });

  const reports = new Gauge({
    name: 'virustotal_reports',
    help: 'Security vendors flagging the domain as malicious or suspicious',
    labelNames: ['domain'],
    registers: [registry],
  });
  const lastSuccess = new Gauge({
    name: 'virustotal_last_success_timestamp_seconds',
    help: 'Unix time of the most recent successful lookup for the domain',
    labelNames: ['domain'],
    registers: [registry],
  });
  const published = new Set<string>();

  return {
    registry,
    recordSuccess(domain, count, nowSeconds) {
      reports.set({ domain }, count);
      lastSuccess.set({ domain }, nowSeconds);
      published.add(domain);
    },
    keepOnly(domains) {
      const keep = new Set(domains);
      for (const domain of published) {
        if (keep.has(domain)) continue;
        reports.remove({ domain });
        lastSuccess.remove({ domain });
        published.delete(domain);
      }
    },
  };
}
