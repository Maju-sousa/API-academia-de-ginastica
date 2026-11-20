import { z } from 'zod';
import { paginationQuery } from '../../utils/pagination.js';

export const idParam = z.object({ id: z.uuid('Identificador inválido') });

const exercise = z.object({
  name: z.string().min(1).max(100),
  sets: z.number().int().min(1).max(20),
  reps: z.number().int().min(1).max(200),
  load: z.number().min(0).max(1000).optional(),
});

export const createWorkoutSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(2000).nullable().optional(),
  exercises: z.array(exercise).max(50).default([]),
  memberId: z.uuid('memberId inválido'),
});

export const updateWorkoutSchema = z
  .object({
    title: z.string().min(2).max(120).optional(),
    description: z.string().max(2000).nullable().optional(),
    exercises: z.array(exercise).max(50).optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Informe ao menos um campo');

export const listWorkoutsQuery = paginationQuery.extend({
  memberId: z.uuid().optional(),
});