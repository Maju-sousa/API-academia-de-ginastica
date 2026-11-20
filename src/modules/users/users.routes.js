import { Router } from 'express';
import { authenticate, authorize, validate } from '../../middlewares/index.js';
import * as controller from './users.controller.js';
import { createUserSchema, listUsersQuery } from './users.schemas.js';

export const usersRoutes = Router();

usersRoutes.use(authenticate, authorize('ADMIN'));

usersRoutes.get('/', validate({ query: listUsersQuery }), controller.list);
usersRoutes.post('/', validate({ body: createUserSchema }), controller.create);