import { Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError.js';
import { logger } from '../lib/logger.js';

const PRISMA_ERRORS = {
  P2002: () => AppError.conflict('Registro já existe'),
  P2003: () => AppError.badRequest('Referência inválida'),
  P2025: () => AppError.notFound(),
};

function toAppError(err) {
  if (err instanceof AppError) return err;

  if (err?.type === 'entity.parse.failed') return AppError.badRequest('JSON malformado');
  if (err?.type === 'entity.too.large') {
    return new AppError(413, 'PAYLOAD_TOO_LARGE', 'Corpo da requisição muito grande');
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return PRISMA_ERRORS[err.code]?.() ?? null;
  }

  return null;
}

export function errorHandler(err, req, res, _next) {
  const error = toAppError(err);

  // unknown errors never leak details, only the log gets the stack
  if (!error) {
    logger.error({ err, requestId: req.id }, 'unhandled error');
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor', requestId: req.id },
    });
  }

  if (error.status === 401 || error.status === 403) {
    logger.warn(
      { requestId: req.id, userId: req.user?.id, path: req.originalUrl, code: error.code },
      'access denied',
    );
  }

  return res.status(error.status).json({
    error: {
      code: error.code,
      message: error.message,
      ...(error.details && { details: error.details }),
      requestId: req.id,
    },
  });
}
