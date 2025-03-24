// src/routes/index.ts
// Contributor: @Fardeen Bablu
// time spent: 10 minutes

import { Router } from "express";
import authRoutes from "./authRoutes";
import userRoutes from "./userRoutes";
import restaurantRoutes from "./restaurantRoutes";
import orderRoutes from "./orderRoutes";

const router = Router();

// Health check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "DormDash API is running" });
});

// Mount routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/restaurants", restaurantRoutes);
router.use("/orders", orderRoutes);

export default router;
