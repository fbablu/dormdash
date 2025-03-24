// src/routes/restaurantRoutes.ts
// Contributor: @Fardeen Bablu
// time spent: 15 minutes

import { Router } from 'express';
import { 
  getAllRestaurants, 
  getRestaurantById, 
  getRestaurantMenu,
  addOrUpdateRestaurant,
  addOrUpdateMenuItem,
  addOrUpdateMenuCategory
} from '../controllers/restaurantController';
import { authenticateUser, isAdmin, isRestaurantOwner } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getAllRestaurants);
router.get('/:id', getRestaurantById);
router.get('/:id/menu', getRestaurantMenu);

// Protected routes for admin/restaurant owners
router.post('/', authenticateUser, isAdmin, addOrUpdateRestaurant);
router.put('/:id', authenticateUser, isRestaurantOwner, addOrUpdateRestaurant);

// Menu management routes
router.post('/:restaurantId/menu', authenticateUser, isRestaurantOwner, addOrUpdateMenuCategory);
router.put('/:restaurantId/menu/:categoryId', authenticateUser, isRestaurantOwner, addOrUpdateMenuCategory);

router.post('/:restaurantId/menu/:categoryId/items', authenticateUser, isRestaurantOwner, addOrUpdateMenuItem);
router.put('/:restaurantId/menu/:categoryId/items/:itemId', authenticateUser, isRestaurantOwner, addOrUpdateMenuItem);

export default router;