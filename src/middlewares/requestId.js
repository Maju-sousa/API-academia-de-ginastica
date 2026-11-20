import { randomUUID } from 'node:crypto';

const SAFE_ID = /^[a-zA-Z0-9-]{16,64}$/;

// reuses nginx's id so proxy and api logs can be matched
export function requestId(req, res, next) {
  const incoming = req.get('x-request-id');
  req.id = incoming && SAFE_ID.test(incoming) ? incoming : randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
}
