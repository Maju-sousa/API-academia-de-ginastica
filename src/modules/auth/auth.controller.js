import * as authService from './auth.service.js';

export async function register(req, res) {
  const result = await authService.register(req.validated.body);
  res.status(201).json({ data: result });
}

export async function login(req, res) {
  const result = await authService.login(req.validated.body);
  res.json({ data: result });
}

export async function me(req, res) {
  const user = await authService.me(req.user.id);
  res.json({ data: user });
}
