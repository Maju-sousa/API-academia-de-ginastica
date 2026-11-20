import { AppError } from '../errors/AppError.js';

export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(AppError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(AppError.forbidden('Você não tem permissão para esta ação'));
    }
    return next();
  };
}
