import * as service from './workouts.service.js';

export async function create(req, res) {
  res.status(201).json({ data: await service.create(req.user, req.validated.body) });
}

export async function list(req, res) {
  const { items, meta } = await service.list(req.user, req.validated.query);
  res.json({ data: items, meta });
}

export async function getById(req, res) {
  res.json({ data: await service.getById(req.user, req.validated.params.id) });
}

export async function update(req, res) {
  res.json({ data: await service.update(req.user, req.validated.params.id, req.validated.body) });
}

export async function remove(req, res) {
  await service.remove(req.user, req.validated.params.id);
  res.status(204).end();
}