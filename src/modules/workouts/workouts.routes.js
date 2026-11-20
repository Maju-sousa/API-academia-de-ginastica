import { Router } from 'express';
import { authenticate, authorize, validate } from '../../middlewares/index.js';
import * as controller from './workouts.controller.js';
import {
  createWorkoutSchema,
  idParam,
  listWorkoutsQuery,
  updateWorkoutSchema,
} from './workouts.schemas.js';

export const workoutsRoutes = Router();

workoutsRoutes.use(authenticate);

workoutsRoutes.get('/', validate({ query: listWorkoutsQuery }), controller.list);
workoutsRoutes.get('/:id', validate({ params: idParam }), controller.getById);

workoutsRoutes.post(
  '/',
  authorize('ADMIN', 'TRAINER'),
  validate({ body: createWorkoutSchema }),
  controller.create,
);
workoutsRoutes.patch(
  '/:id',
  authorize('ADMIN', 'TRAINER'),
  validate({ params: idParam, body: updateWorkoutSchema }),
  controller.update,
);
workoutsRoutes.delete(
  '/:id',
  authorize('ADMIN', 'TRAINER'),
  validate({ params: idParam }),
  controller.remove,
);