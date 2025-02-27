import { Router } from 'express';
import { getUserFavorites, toggleFavorite, getUserProfile } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/:userId/favorites', authenticateToken, getUserFavorites);
router.post('/favorites', authenticateToken, toggleFavorite);
router.get('/:userId/profile', authenticateToken, getUserProfile);

export default router; 