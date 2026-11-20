import { rateLimit } from 'express-rate-limit';
import { isTest } from '../config/env.js';

function limiter(windowMs, limit) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => isTest,
    handler: (req, res) => {
      res.status(429).json({
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: 'Muitas requisições. Tente novamente mais tarde.',
          requestId: req.id,
        },
      });
    },
  });
}

export const globalLimiter = limiter(60 * 1000, 300);
export const authLimiter = limiter(15 * 60 * 1000, 10);
