import { createLogger, type Logger } from '../src/log.js';

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

export function fetchReturning(...responses: Response[]): typeof fetch {
  const queue = [...responses];
  return async () => {
    const next = queue.shift();
    if (!next) throw new Error('unexpected fetch call');
    return next;
  };
}

export function capturingLogger(): { log: Logger; lines: { level: string; msg: string }[] } {
  const lines: { level: string; msg: string }[] = [];
  const log = createLogger('debug', (line) => lines.push(JSON.parse(line)));
  return { log, lines };
}
