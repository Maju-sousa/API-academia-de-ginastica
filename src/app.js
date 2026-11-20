import { hostname } from 'node:os';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import {
  errorHandler,
  globalLimiter,
  notFound,
  requestId,
  requestLogger,
  sanitize,
} from './middlewares/index.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { routes } from './routes.js';

const instance = hostname();

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // order matters, see docs/middlewares.md
  app.use(requestId);
  app.use(requestLogger);
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(',') }));
  app.use((_req, res, next) => {
    res.setHeader('X-Instance', instance);
    next();
  });
  app.use(globalLimiter);
  app.use(express.json({ limit: '100kb' }));
  app.use(sanitize);

  app.use('/health', healthRoutes);
  app.use('/api/v1', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
