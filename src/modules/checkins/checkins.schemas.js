import { z } from 'zod';
import { paginationQuery } from '../../utils/pagination.js';

// member checks in by himself (body empty); staff may check in a member at the front desk
export const createCheckInSchema = z.object({ memberId: z.uuid('memberId inválido').optional() });

export const listCheckInsQuery = paginationQuery.extend({
  memberId: z.uuid().optional(),
  from: z.iso.date('Data inválida (use AAAA-MM-DD)').optional(),
  to: z.iso.date('Data inválida (use AAAA-MM-DD)').optional(),
});