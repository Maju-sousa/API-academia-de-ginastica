export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message = 'Requisição inválida', details) {
    return new AppError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Não autenticado') {
    return new AppError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'Acesso negado') {
    return new AppError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Recurso não encontrado') {
    return new AppError(404, 'NOT_FOUND', message);
  }

  static conflict(message = 'Conflito com o estado atual do recurso') {
    return new AppError(409, 'CONFLICT', message);
  }
}
