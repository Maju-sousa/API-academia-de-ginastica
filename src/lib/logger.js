import pino from 'pino';
import { env, isProduction } from '../config/env.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: 'starlife-api' },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.passwordHash',
      '*.accessToken',
    ],
    censor: '[redacted]',
  },
  transport: isProduction ? undefined : { target: 'pino-pretty' },
});
