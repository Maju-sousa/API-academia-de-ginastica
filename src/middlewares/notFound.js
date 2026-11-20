import { AppError } from '../errors/AppError.js';

export function notFound(req, _res, next) {
  next(AppError.notFound(`Rota ${req.method} ${req.path} não encontrada`));
}
