import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { sanitizeValue } from '../src/middlewares/sanitize.js';

const app = createApp();

describe('pipeline', () => {
  it('returns a standard 404 carrying the request id', async () => {
    const res = await request(app).get('/api/v1/missing');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.requestId).toBe(res.headers['x-request-id']);
  });

  it('rejects malformed json without leaking a stack trace', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": ');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
    expect(JSON.stringify(res.body)).not.toMatch(/at .*\.js/);
  });

  it('lists every invalid field', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'A', email: 'invalid', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d) => d.field)).toEqual(
      expect.arrayContaining(['name', 'email', 'password']),
    );
  });

  it('requires a token on protected routes', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects unsigned tokens', async () => {
    const token = jwt.sign({ role: 'ADMIN' }, null, { algorithm: 'none', subject: 'x' });
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
  });

  it('sets security headers', async () => {
    const res = await request(app).get('/api/v1/missing');

    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-instance']).toBeDefined();
  });
});

describe('sanitizeValue', () => {
  it('drops dangerous keys, control chars and whitespace', () => {
    const input = JSON.parse('{"__proto__": {"admin": true}, "$where": "1", "name": "  Ana\\u0000 "}');

    expect(sanitizeValue(input)).toEqual({ name: 'Ana' });
  });
});
