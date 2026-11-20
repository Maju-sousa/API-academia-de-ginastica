import { Router } from 'express';
import { authenticate, authorize, validate } from '../../middlewares/index.js';
import { AppError } from '../../errors/AppError.js';
import { Roles } from '../../utils/roles.js';
import * as controller from './members.controller.js';
import {
  adminUpdateMemberSchema,
  createMemberSchema,
  idParam,
  listMembersQuery,
  updateMemberSchema,
} from './members.schemas.js';

export const membersRoutes = Router();

membersRoutes.use(authenticate);

membersRoutes.get('/', authorize('ADMIN', 'TRAINER'), validate({ query: listMembersQuery }), controller.list);
membersRoutes.post('/', authorize('ADMIN'), validate({ body: createMemberSchema }), controller.create);

// must come before /:id
membersRoutes.get('/me', authorize('MEMBER'), controller.getMine);

membersRoutes.get('/:id', validate({ params: idParam }), controller.getById);

const pickUpdateSchema = (req, res, next) => {
  const schema = req.user.role === Roles.ADMIN ? adminUpdateMemberSchema : updateMemberSchema;
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      location: 'body',
      field: i.path.join('.'),
      message: i.message,
    }));
    return next(AppError.badRequest('Dados de entrada inválidos', details));
  }
  req.validated = { ...req.validated, body: result.data };
  return next();
};

membersRoutes.patch(
  '/:id',
  authorize('ADMIN', 'MEMBER'),
  validate({ params: idParam }),
  pickUpdateSchema,
  controller.update,
);