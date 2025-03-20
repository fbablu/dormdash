// server/src/routes/index.ts
import { Router, Request, Response } from "express";

const router = Router();

// Root route
router.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "DormDash API is running",
    version: "1.0.0",
    endpoints: [
      "/api/health",
      "/api/auth/google",
      "/api/user/profile",
      "/api/restaurants",
      "/api/orders",
      "/api/user/orders",
      "/api/delivery/requests",
      "/api/users/favorites",
    ],
  });
});

export default router;
