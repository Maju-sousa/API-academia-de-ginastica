import { z } from 'zod';

// asvs v6.2: at least 8 chars, allow 64+, no composition rules
const password = z
  .string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres')
  .max(128, 'A senha deve ter no máximo 128 caracteres');

export const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.email('E-mail inválido').max(254).toLowerCase(),
  password,
});

export const loginSchema = z.object({
  email: z.email('E-mail inválido').toLowerCase(),
  password: z.string().min(1).max(128),
});
