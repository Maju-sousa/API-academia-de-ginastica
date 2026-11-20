import bcrypt from 'bcryptjs';
import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';
import { AppError } from '../../errors/AppError.js';
import { paginate, pageMeta } from '../../utils/pagination.js';
import { assertCanAccessMember, memberOfUser } from '../../utils/ownership.js';
import { Roles } from '../../utils/roles.js';

const include = { user: { select: { id: true, name: true, email: true } } };

const toDate = (v) => (v ? new Date(`${v}T00:00:00.000Z`) : v);

export async function create(actor, { name, email, password, phone, birthDate }) {
  const taken = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (taken) throw AppError.conflict('E-mail já cadastrado');

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, env.BCRYPT_ROUNDS),
      role: Roles.MEMBER,
      member: { create: { phone, birthDate: toDate(birthDate) } },
    },
    select: { member: { include } },
  });

  logger.info({ actorId: actor.id, memberId: user.member.id }, 'member created');
  return user.member;
}

export async function list({ status, search, ...paging }) {
  const where = {
    ...(status && { status }),
    ...(search && {
      user: {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      },
    }),
  };

  const [items, total] = await Promise.all([
    prisma.member.findMany({ where, include, orderBy: { createdAt: 'desc' }, ...paginate(paging) }),
    prisma.member.count({ where }),
  ]);
  return { items, meta: pageMeta(paging, total) };
}

export async function getById(user, id) {
  await assertCanAccessMember(user, id);
  const member = await prisma.member.findUnique({ where: { id }, include });
  if (!member) throw AppError.notFound('Membro não encontrado');
  return member;
}

export async function getMine(user) {
  const { id } = await memberOfUser(user.id);
  return getById(user, id);
}

export async function update(user, id, data) {
  await assertCanAccessMember(user, id);

  const { birthDate, ...rest } = data;
  return prisma.member.update({
    where: { id },
    data: { ...rest, ...(birthDate !== undefined && { birthDate: toDate(birthDate) }) },
    include,
  });
}