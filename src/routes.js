import { Router } from 'express';
import { authRoutes } from './modules/auth/auth.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { membersRoutes } from './modules/members/members.routes.js';
import { workoutsRoutes } from './modules/workouts/workouts.routes.js';
import { checkInsRoutes } from './modules/checkins/checkins.routes.js';

export const routes = Router();

routes.use('/auth', authRoutes);
routes.use('/users', usersRoutes);
routes.use('/members', membersRoutes);
routes.use('/workouts', workoutsRoutes);
routes.use('/check-ins', checkInsRoutes);