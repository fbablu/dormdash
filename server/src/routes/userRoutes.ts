// src/routes/userRoutes.ts
// Contributor: @Fardeen Bablu
// time spent: 15 minutes

import { Router } from 'express';
import { getProfile, updateProfile, verifyDorm, getFavorites, toggleFavorite } from '../controllers/userController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateUser);

// User profile routes
router.get('/:id/profile', getProfile);
router.put('/:id/profile', updateProfile);
router.post('/:id/verify-dorm', verifyDorm);

// Favorites routes
router.get('/:id/favorites', getFavorites);
router.post('/favorites', toggleFavorite);

export default router;