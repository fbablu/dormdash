// src/routes/authRoutes.ts
// Contributor: @Fardeen Bablu
// time spent: 10 minutes

import { Router } from "express";
import {
  authenticateWithGoogle,
  checkAuth,
  refreshToken,
} from "../controllers/authController";
import { authenticateUser } from "../middleware/auth";

const router = Router();

// Public routes
router.post("/google", authenticateWithGoogle);

// Protected routes
router.get("/check", authenticateUser, checkAuth);
router.post("/refresh-token", authenticateUser, refreshToken);

export default router;
