// src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import { auth } from "../config/firebase";

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email: string;
        role?: string;
      };
    }
  }
}

/**
 * Authentication middleware to verify Firebase ID token
 */
export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Allow token from authorization header or query params for testing
  const token =
    req.headers.authorization?.split("Bearer ")[1] ||
    (req.query.token as string);

  if (!token) {
    return res.status(401).json({ error: "Unauthorized - No token provided" });
  }

  try {
    // Verify the token with Firebase Admin
    const decodedToken = await auth.verifyIdToken(token);

    // Get user record
    const userRecord = await auth.getUser(decodedToken.uid);

    // Set user data in request
    req.user = {
      uid: userRecord.uid,
      email: userRecord.email || "",
      // Custom claims might include role information
      role: decodedToken.role || "user",
    };

    next();
  } catch (error: any) {
    console.error("Authentication error:", error);

    // Handle token expiration specifically
    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({ error: "Token expired" });
    }

    return res.status(401).json({ error: "Unauthorized - Invalid token" });
  }
};

/**
 * Check if user has admin role
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden - Admin access required" });
  }

  next();
};

/**
 * Check if user has restaurant owner role or is admin
 */
export const isRestaurantOwner = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.user.role !== "restaurant_owner" && req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Forbidden - Restaurant owner access required" });
  }

  next();
};

/**
 * Check if user is authenticated with Vanderbilt email
 */
export const isVanderbiltUser = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const isVanderbiltEmail = req.user.email.endsWith("@vanderbilt.edu");

  if (!isVanderbiltEmail) {
    return res
      .status(403)
      .json({ error: "Forbidden - Vanderbilt email required" });
  }

  next();
};
