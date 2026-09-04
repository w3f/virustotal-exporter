export const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

type Fields = Record<string, unknown>;

export interface Logger {
  debug(msg: string, fields?: Fields): void;
  info(msg: string, fields?: Fields): void;
  warn(msg: string, fields?: Fields): void;
  error(msg: string, fields?: Fields): void;
}

export function createLogger(threshold: LogLevel, write = console.log): Logger {
  const minimum = LOG_LEVELS.indexOf(threshold);
  const emit =
    (level: LogLevel) =>
    (msg: string, fields: Fields = {}) => {
      if (LOG_LEVELS.indexOf(level) < minimum) return;
      write(JSON.stringify({ time: new Date().toISOString(), level, msg, ...fields }));
    };
  return { debug: emit('debug'), info: emit('info'), warn: emit('warn'), error: emit('error') };
}

export function errorFields(err: unknown): Fields {
  return { error: describe(err) };
}

function describe(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  return err.cause === undefined ? err.message : `${err.message}: ${describe(err.cause)}`;
}
