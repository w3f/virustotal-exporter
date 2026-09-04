import { errorFields, type Logger } from './log.js';

export interface DomainSource {
  cloudflareApiToken: string | undefined;
  configured: string[];
  listZones(token: string): Promise<string[]>;
  log: Logger;
}

// The first resolution must succeed completely: a truncated set is a blind spot.
// Later failures fall back to the previous set so one Cloudflare outage does not stop monitoring.
export async function resolveDomains(
  source: DomainSource,
  previous: string[] | undefined,
): Promise<string[]> {
  let zones: string[] = [];
  if (source.cloudflareApiToken) {
    try {
      zones = await source.listZones(source.cloudflareApiToken);
    } catch (err) {
      if (previous === undefined)
        throw new Error('Cloudflare zone enumeration failed', { cause: err });
      source.log.error(
        'Cloudflare zone enumeration failed, reusing previous domain set',
        errorFields(err),
      );
      return previous;
    }
  }
  const domains = [...new Set([...zones, ...source.configured].map((d) => d.toLowerCase()))];
  if (domains.length === 0)
    throw new Error('no domains to watch: no Cloudflare zones and DOMAINS is empty');
  return domains;
}
