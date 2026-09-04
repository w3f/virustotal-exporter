const ZONES_URL = 'https://api.cloudflare.com/client/v4/zones';
const PER_PAGE = 50;

interface ZonesPage {
  success: boolean;
  errors: { message: string }[];
  result: { name: string }[];
  result_info: { total_pages: number };
}

export async function listZones(token: string, fetchFn = fetch): Promise<string[]> {
  const zones: string[] = [];
  for (let page = 1, totalPages = 1; page <= totalPages; page++) {
    const body = await fetchPage(token, page, fetchFn);
    zones.push(...body.result.map((zone) => zone.name));
    totalPages = body.result_info.total_pages;
  }
  return zones;
}

async function fetchPage(token: string, page: number, fetchFn: typeof fetch): Promise<ZonesPage> {
  const response = await fetchFn(`${ZONES_URL}?per_page=${PER_PAGE}&page=${page}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Cloudflare zones page ${page}: HTTP ${response.status}`);
  const body = (await response.json()) as Partial<ZonesPage>;
  if (!body.success || !Array.isArray(body.result) || !body.result_info) {
    const reason = body.errors?.map((e) => e.message).join('; ') || 'malformed response';
    throw new Error(`Cloudflare zones page ${page}: ${reason}`);
  }
  return body as ZonesPage;
}
