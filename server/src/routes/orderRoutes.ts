// src/routes/orderRoutes.ts
// Contributor: @Fardeen Bablu
// time spent: 15 minutes

import { Router } from 'express';
import { 
  createOrder, 
  getUserOrders, 
  getOrderById, 
  updateOrderStatus,
  getDeliveryRequests,
  acceptDelivery,
  getUserDeliveries
} from '../controllers/orderController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateUser);

// Order routes
router.post('/', createOrder);
router.get('/user', getUserOrders);
router.get('/:id', getOrderById);
router.put('/:id/status', updateOrderStatus);

// Delivery routes
router.get('/delivery/requests', getDeliveryRequests);
router.post('/delivery/accept/:id', acceptDelivery);
router.get('/delivery/active', getUserDeliveries);

export default router;