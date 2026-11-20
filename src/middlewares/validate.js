import { AppError } from '../errors/AppError.js';

export function validate(schemas = {}) {
  return (req, _res, next) => {
    const sources = {
      body: req.body,
      params: req.params,
      query: req.cleanQuery ?? req.query,
    };
    const validated = {};
    const details = [];

    for (const [location, schema] of Object.entries(schemas)) {
      const result = schema.safeParse(sources[location] ?? {});

      if (result.success) {
        validated[location] = result.data;
        continue;
      }

      for (const issue of result.error.issues) {
        details.push({ location, field: issue.path.join('.'), message: issue.message });
      }
    }

    if (details.length) {
      return next(AppError.badRequest('Dados de entrada inválidos', details));
    }

    req.validated = validated;
    return next();
  };
}
