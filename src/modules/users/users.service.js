import bcrypt from 'bcryptjs';
import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';
import { AppError } from '../../errors/AppError.js';
import { paginate, pageMeta } from '../../utils/pagination.js';

const publicSelect = { id: true, name: true, email: true, role: true, createdAt: true };

// admins and trainers are only created by an admin (public sign up is member only)
export async function create(actor, { name, email, password, role }) {
  const taken = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (taken) throw AppError.conflict('E-mail já cadastrado');

  const user = await prisma.user.create({
    data: { name, email, role, passwordHash: await bcrypt.hash(password, env.BCRYPT_ROUNDS) },
    select: publicSelect,
  });

  logger.info({ actorId: actor.id, userId: user.id, role }, 'staff user created');
  return user;
}

export async function list({ role, ...paging }) {
  const where = role ? { role } : {};
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: publicSelect,
      orderBy: { createdAt: 'desc' },
      ...paginate(paging),
    }),
    prisma.user.count({ where }),
  ]);
  return { items, meta: pageMeta(paging, total) };
}