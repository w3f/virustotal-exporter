import { listZones } from './cloudflare.js';
import { loadConfig } from './config.js';
import { createLogger, errorFields } from './log.js';
import { createMetrics } from './metrics.js';
import { createHttpServer } from './server.js';
import { createSweeper } from './sweep.js';
import { lookupReports } from './virustotal.js';

const PORT = 3000;

const config = (() => {
  try {
    return loadConfig(process.env);
  } catch (err) {
    console.error(
      JSON.stringify({ level: 'error', msg: 'invalid configuration', ...errorFields(err) }),
    );
    process.exit(1);
  }
})();

const log = createLogger(config.logLevel);
const metrics = createMetrics();
const sweeper = createSweeper({
  source: {
    cloudflareApiToken: config.cloudflareApiToken,
    configured: config.domains,
    listZones,
    log,
  },
  metrics,
  log,
  lookupReports: (domain) => lookupReports(config.virustotalApiKey, domain),
});

const server = createHttpServer(metrics.registry).listen(PORT, () => {
  log.info('listening', { port: PORT, intervalMinutes: config.intervalMinutes });
});

const fatal = (err: unknown) => {
  log.error('fatal error, exiting', errorFields(err));
  process.exit(1);
};
void sweeper.tick().catch(fatal);
const timer = setInterval(() => void sweeper.tick().catch(fatal), config.intervalMinutes * 60_000);

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    log.info('shutting down', { signal });
    clearInterval(timer);
    server.close(() => process.exit(0));
  });
}
