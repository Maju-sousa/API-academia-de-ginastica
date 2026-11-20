import { z } from 'zod';
import { paginationQuery } from '../../utils/pagination.js';

const phone = z
  .string()
  .regex(/^[0-9+()\-\s]{8,20}$/, 'Telefone inválido')
  .nullable();
const birthDate = z.iso.date('Data inválida (use AAAA-MM-DD)').nullable();
const status = z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']);

export const idParam = z.object({ id: z.uuid('Identificador inválido') });

export const createMemberSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.email('E-mail inválido').max(254).toLowerCase(),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres').max(128),
  phone: phone.optional(),
  birthDate: birthDate.optional(),
});

// .strict() rejects unknown keys, so a member cannot slip "status" into his own update
export const updateMemberSchema = z
  .object({ phone: phone.optional(), birthDate: birthDate.optional() })
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Informe ao menos um campo');

export const adminUpdateMemberSchema = z
  .object({ phone: phone.optional(), birthDate: birthDate.optional(), status: status.optional() })
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Informe ao menos um campo');

export const listMembersQuery = paginationQuery.extend({
  status: status.optional(),
  search: z.string().min(1).max(100).optional(),
});