import { z } from 'zod';
import { paginationQuery } from '../../utils/pagination.js';

const password = z.string().min(8, 'A senha deve ter no mínimo 8 caracteres').max(128);

export const createUserSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.email('E-mail inválido').max(254).toLowerCase(),
  password,
  role: z.enum(['ADMIN', 'TRAINER']),
});

export const listUsersQuery = paginationQuery.extend({
  role: z.enum(['ADMIN', 'TRAINER', 'MEMBER']).optional(),
});