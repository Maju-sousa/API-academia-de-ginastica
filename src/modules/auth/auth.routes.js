import { Router } from 'express';
import { authenticate, authLimiter, validate } from '../../middlewares/index.js';
import * as controller from './auth.controller.js';
import { loginSchema, registerSchema } from './auth.schemas.js';

export const authRoutes = Router();

authRoutes.post('/register', authLimiter, validate({ body: registerSchema }), controller.register);
authRoutes.post('/login', authLimiter, validate({ body: loginSchema }), controller.login);
authRoutes.get('/me', authenticate, controller.me);
