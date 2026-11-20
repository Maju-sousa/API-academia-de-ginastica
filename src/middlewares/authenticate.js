import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../errors/AppError.js';

export function authenticate(req, _res, next) {
  const [scheme, token] = (req.get('authorization') ?? '').split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(AppError.unauthorized('Token de acesso ausente'));
  }

  try {
    // pinning the algorithm blocks alg=none and algorithm confusion
    const payload = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch {
    return next(AppError.unauthorized('Token inválido ou expirado'));
  }
}
