import * as service from './checkins.service.js';

export async function create(req, res) {
  res.status(201).json({ data: await service.create(req.user, req.validated.body) });
}

export async function list(req, res) {
  const { items, meta } = await service.list(req.user, req.validated.query);
  res.json({ data: items, meta });
}