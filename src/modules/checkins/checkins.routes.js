import { Router } from 'express';
import { authenticate, validate } from '../../middlewares/index.js';
import * as controller from './checkins.controller.js';
import { createCheckInSchema, listCheckInsQuery } from './checkins.schemas.js';

export const checkInsRoutes = Router();

// every role can use it, the service restricts a member to his own check-ins
checkInsRoutes.use(authenticate);

checkInsRoutes.post('/', validate({ body: createCheckInSchema }), controller.create);
checkInsRoutes.get('/', validate({ query: listCheckInsQuery }), controller.list);