import { LOG_LEVELS, type LogLevel } from './log.js';

export interface Config {
  virustotalApiKey: string;
  cloudflareApiToken: string | undefined;
  domains: string[];
  intervalMinutes: number;
  logLevel: LogLevel;
}

export function loadConfig(env: NodeJS.ProcessEnv): Config {
  const virustotalApiKey = env.VIRUSTOTAL_API_KEY;
  if (!virustotalApiKey) throw new Error('VIRUSTOTAL_API_KEY is required');

  const intervalMinutes = Number(env.INTERVAL_MINUTES ?? '480');
  if (!Number.isFinite(intervalMinutes) || intervalMinutes <= 0) {
    throw new Error('INTERVAL_MINUTES must be a positive number');
  }

  const logLevel = env.LOG_LEVEL ?? 'info';
  if (!isLogLevel(logLevel)) throw new Error(`LOG_LEVEL must be one of ${LOG_LEVELS.join(', ')}`);

  return {
    virustotalApiKey,
    cloudflareApiToken: env.CLOUDFLARE_API_TOKEN || undefined,
    domains: parseDomainList(env.DOMAINS ?? ''),
    intervalMinutes,
    logLevel,
  };
}

export function parseDomainList(value: string): string[] {
  return value
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter((d) => d.length > 0);
}

function isLogLevel(value: string): value is LogLevel {
  return (LOG_LEVELS as readonly string[]).includes(value);
}
