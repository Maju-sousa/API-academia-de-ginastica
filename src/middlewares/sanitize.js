const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const MAX_DEPTH = 10;
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function sanitizeValue(value, depth = 0) {
  if (depth > MAX_DEPTH) return undefined;

  if (typeof value === 'string') return value.replace(CONTROL_CHARS, '').trim();
  if (Array.isArray(value)) return value.map((v) => sanitizeValue(v, depth + 1));

  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, v] of Object.entries(value)) {
      if (FORBIDDEN_KEYS.has(key) || key.startsWith('$')) continue;
      out[key] = sanitizeValue(v, depth + 1);
    }
    return out;
  }

  return value;
}

export function sanitize(req, _res, next) {
  if (req.body && typeof req.body === 'object') req.body = sanitizeValue(req.body);

  for (const key of Object.keys(req.params ?? {})) {
    req.params[key] = sanitizeValue(req.params[key]);
  }

  // req.query is a read-only getter in express 5
  req.cleanQuery = sanitizeValue({ ...req.query });
  next();
}
