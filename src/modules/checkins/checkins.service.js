import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';
import { AppError } from '../../errors/AppError.js';
import { paginate, pageMeta } from '../../utils/pagination.js';
import { isStaff, memberOfUser } from '../../utils/ownership.js';

// avoids double taps / duplicated registrations
export const COOLDOWN_MINUTES = 60;

export async function create(user, { memberId } = {}) {
  let targetId;

  if (isStaff(user)) {
    if (!memberId) throw AppError.badRequest('Informe o memberId do membro');
    targetId = memberId;
  } else {
    // a member can only register his own presence, any memberId in the body is ignored
    targetId = (await memberOfUser(user.id)).id;
  }

  const member = await prisma.member.findUnique({
    where: { id: targetId },
    select: { id: true, status: true },
  });
  if (!member) throw AppError.notFound('Membro não encontrado');
  if (member.status !== 'ACTIVE') throw AppError.forbidden('Membro inativo ou suspenso');

  const since = new Date(Date.now() - COOLDOWN_MINUTES * 60 * 1000);
  const recent = await prisma.checkIn.findFirst({
    where: { memberId: targetId, createdAt: { gte: since } },
    select: { id: true },
  });
  if (recent) throw AppError.conflict(`Check-in já registrado nos últimos ${COOLDOWN_MINUTES} minutos`);

  const checkIn = await prisma.checkIn.create({ data: { memberId: targetId } });
  logger.info({ checkInId: checkIn.id, memberId: targetId, actorId: user.id }, 'check-in registered');
  return checkIn;
}

export async function list(user, { memberId, from, to, ...paging }) {
  const where = {};

  if (isStaff(user)) {
    if (memberId) where.memberId = memberId;
  } else {
    where.memberId = (await memberOfUser(user.id)).id;
  }

  if (from || to) {
    where.createdAt = {
      ...(from && { gte: new Date(`${from}T00:00:00.000Z`) }),
      ...(to && { lte: new Date(`${to}T23:59:59.999Z`) }),
    };
  }

  const [items, total] = await Promise.all([
    prisma.checkIn.findMany({ where, orderBy: { createdAt: 'desc' }, ...paginate(paging) }),
    prisma.checkIn.count({ where }),
  ]);
  return { items, meta: pageMeta(paging, total) };
}