// server/src/middleware/auth.ts
// Contributors: @Fardeen Bablu
// Time spent: 1 hour

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const GOOGLE_CLIENT_ID =
  "895573352563-bglvrv3e9visj279hc9g157787jd4on3.apps.googleusercontent.com";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // First try to verify as a JWT token
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET!);
      req.user = user;
      return next();
    } catch (jwtError) {
      // If JWT verification fails, try Google token
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: token,
          audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload) {
          throw new Error("Invalid Google token");
        }

        req.user = {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
        };
        return next();
      } catch (googleError) {
        console.error("Token verification failed:", { jwtError, googleError });
        return res.status(403).json({ error: "Invalid token" });
      }
    }
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
};
