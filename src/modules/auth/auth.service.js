import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';
import { AppError } from '../../errors/AppError.js';
import { Roles } from '../../utils/roles.js';

// compared against when the email doesn't exist, keeps response time even
const DUMMY_HASH = bcrypt.hashSync('starlife-dummy-password', 10);

export function toPublicUser({ passwordHash: _, ...user }) {
  return user;
}

function signToken(user) {
  return jwt.sign({ role: user.role }, env.JWT_SECRET, {
    subject: user.id,
    algorithm: 'HS256',
    expiresIn: env.JWT_EXPIRES_IN,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });
}

function session(user) {
  return { user: toPublicUser(user), accessToken: signToken(user) };
}

// public sign up is always a member, admins and trainers come from an admin
export async function register({ name, email, password }) {
  const taken = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (taken) throw AppError.conflict('E-mail já cadastrado');

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, env.BCRYPT_ROUNDS),
      role: Roles.MEMBER,
      member: { create: {} },
    },
  });

  logger.info({ userId: user.id }, 'user registered');
  return session(user);
}

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !valid) {
    logger.warn({ email }, 'login failed');
    throw AppError.unauthorized('Credenciais inválidas');
  }

  logger.info({ userId: user.id }, 'login succeeded');
  return session(user);
}

export async function me(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { member: true },
  });
  if (!user) throw AppError.notFound('Usuário não encontrado');

  return toPublicUser(user);
}
