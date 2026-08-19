import { structuredLogger, type BaseLogger } from '@hono/structured-logger';

function emit(level: 'info' | 'warn' | 'error' | 'debug', data: unknown, msg?: string) {
  const line = JSON.stringify(msg === undefined ? { level, data } : { level, msg, data });
  if (level === 'error') {
    // oxlint-disable-next-line no-console
    console.error(line);
  } else if (level === 'warn') {
    // oxlint-disable-next-line no-console
    console.warn(line);
  } else {
    // oxlint-disable-next-line no-console
    console.log(line);
  }
}

const consoleLogger: BaseLogger = {
  info: (data, msg) => emit('info', data, msg),
  warn: (data, msg) => emit('warn', data, msg),
  error: (data, msg) => emit('error', data, msg),
  debug: (data, msg) => emit('debug', data, msg),
};

export const apexStructuredLogger = structuredLogger({ createLogger: () => consoleLogger });
