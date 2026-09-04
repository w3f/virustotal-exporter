const DOMAIN_URL = 'https://www.virustotal.com/api/v3/domains';

interface DomainReport {
  data: { attributes: { last_analysis_stats: { malicious: number; suspicious: number } } };
}

// A domain VirusTotal has never analysed (404) is flagged by nobody, hence 0.
export async function lookupReports(
  apiKey: string,
  domain: string,
  fetchFn = fetch,
): Promise<number> {
  const response = await fetchFn(`${DOMAIN_URL}/${encodeURIComponent(domain)}`, {
    headers: { 'x-apikey': apiKey },
  });
  if (response.status === 404) return 0;
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const stats = ((await response.json()) as Partial<DomainReport>).data?.attributes
    ?.last_analysis_stats;
  if (typeof stats?.malicious !== 'number' || typeof stats.suspicious !== 'number') {
    throw new Error('malformed response: last_analysis_stats missing');
  }
  return stats.malicious + stats.suspicious;
}
