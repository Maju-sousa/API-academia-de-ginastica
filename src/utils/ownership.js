import { prisma } from '../lib/prisma.js';
import { AppError } from '../errors/AppError.js';
import { Roles } from './roles.js';

export const isStaff = (user) => user.role === Roles.ADMIN || user.role === Roles.TRAINER;

export async function memberOfUser(userId) {
  const member = await prisma.member.findUnique({ where: { userId }, select: { id: true } });
  if (!member) throw AppError.forbidden('Usuário não possui perfil de membro');
  return member;
}

export async function assertCanAccessMember(user, memberId) {
  if (isStaff(user)) return;
  const own = await memberOfUser(user.id);
  if (own.id !== memberId) throw AppError.forbidden('Você só pode acessar os seus próprios dados');
}