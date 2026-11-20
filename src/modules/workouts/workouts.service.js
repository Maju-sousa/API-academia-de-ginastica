import { prisma } from '../../lib/prisma.js';
import { cache } from '../../lib/cache.js';
import { logger } from '../../lib/logger.js';
import { AppError } from '../../errors/AppError.js';
import { paginate, pageMeta } from '../../utils/pagination.js';
import { memberOfUser } from '../../utils/ownership.js';
import { Roles } from '../../utils/roles.js';

// cache strategy (docs/cache.md): read-through with 60s ttl + explicit invalidation
// of the whole "workouts:" prefix on every write
const TTL = 60;
const PREFIX = 'workouts:';
const invalidate = () => cache.forgetPrefix(PREFIX);

const include = {
  trainer: { select: { id: true, name: true } },
  member: { select: { id: true, userId: true, user: { select: { name: true } } } },
};

// the cached object is never filtered by user, authorization runs after the cache read
async function loadWorkout(id) {
  return cache.remember(
    `${PREFIX}item:${id}`,
    () => prisma.workout.findUnique({ where: { id }, include }),
    TTL,
  );
}

function canManage(user, workout) {
  return user.role === Roles.ADMIN || workout.trainerId === user.id;
}

export async function create(user, { memberId, ...data }) {
  const member = await prisma.member.findUnique({ where: { id: memberId }, select: { id: true } });
  if (!member) throw AppError.notFound('Membro não encontrado');

  const workout = await prisma.workout.create({
    data: { ...data, memberId, trainerId: user.id },
    include,
  });

  await invalidate();
  logger.info({ workoutId: workout.id, trainerId: user.id }, 'workout created');
  return workout;
}

export async function list(user, { memberId, ...paging }) {
  // who can see what: member -> own, trainer -> the ones he created, admin -> all
  let where = {};
  let scope = 'all';

  if (user.role === Roles.MEMBER) {
    const own = await memberOfUser(user.id);
    where = { memberId: own.id };
    scope = `member:${own.id}`;
  } else {
    if (user.role === Roles.TRAINER) {
      where.trainerId = user.id;
      scope = `trainer:${user.id}`;
    }
    if (memberId) where.memberId = memberId;
  }

  // scope is part of the key, so one user never receives another user's cached list
  const key = `${PREFIX}list:${scope}:${memberId ?? '-'}:${paging.page}:${paging.limit}`;

  return cache.remember(
    key,
    async () => {
      const [items, total] = await Promise.all([
        prisma.workout.findMany({
          where,
          include,
          orderBy: { createdAt: 'desc' },
          ...paginate(paging),
        }),
        prisma.workout.count({ where }),
      ]);
      return { items, meta: pageMeta(paging, total) };
    },
    TTL,
  );
}

export async function getById(user, id) {
  const workout = await loadWorkout(id);
  if (!workout) throw AppError.notFound('Treino não encontrado');

  if (user.role === Roles.MEMBER && workout.member.userId !== user.id) {
    throw AppError.forbidden('Você só pode acessar os seus próprios treinos');
  }
  if (user.role === Roles.TRAINER && workout.trainerId !== user.id) {
    throw AppError.forbidden('Você só pode acessar os treinos que criou');
  }
  return workout;
}

export async function update(user, id, data) {
  const current = await prisma.workout.findUnique({ where: { id } });
  if (!current) throw AppError.notFound('Treino não encontrado');
  if (!canManage(user, current)) throw AppError.forbidden('Apenas quem criou o treino pode alterá-lo');

  const workout = await prisma.workout.update({ where: { id }, data, include });
  await invalidate();
  return workout;
}

export async function remove(user, id) {
  const current = await prisma.workout.findUnique({ where: { id } });
  if (!current) throw AppError.notFound('Treino não encontrado');
  if (!canManage(user, current)) throw AppError.forbidden('Apenas quem criou o treino pode removê-lo');

  await prisma.workout.delete({ where: { id } });
  await invalidate();
}