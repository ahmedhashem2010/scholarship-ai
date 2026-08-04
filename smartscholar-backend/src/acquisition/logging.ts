const DEBUG = process.env.ACQUISITION_DEBUG === '1' || process.env.AI_DEBUG === '1';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function ts(): string {
  return new Date().toISOString();
}

export function log(level: LogLevel, component: string, message: string, extra?: unknown): void {
  if (level === 'debug' && !DEBUG) return;
  const suffix = extra !== undefined ? ` ${JSON.stringify(extra)}` : '';
  const line = `[acquire] ${ts()} ${level.toUpperCase().padEnd(5)} ${component} ${message}${suffix}`;
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (c: string, m: string, e?: unknown) => log('debug', c, m, e),
  info: (c: string, m: string, e?: unknown) => log('info', c, m, e),
  warn: (c: string, m: string, e?: unknown) => log('warn', c, m, e),
  error: (c: string, m: string, e?: unknown) => log('error', c, m, e),
};
