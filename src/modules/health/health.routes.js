import { hostname } from 'node:os';
import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { cache } from '../../lib/cache.js';

export const healthRoutes = Router();

healthRoutes.get('/', async (_req, res) => {
  const database = await prisma.$queryRaw`SELECT 1`.then(() => 'up', () => 'down');
  const redis = (await cache.ping()) ? 'up' : 'down';
  const healthy = database === 'up';

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    instance: hostname(),
    uptime: Math.round(process.uptime()),
    services: { database, redis },
  });
});
