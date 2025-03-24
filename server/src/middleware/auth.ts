// server/src/middleware/auth.ts
// Contributor: @Fardeen Bablu
// Time spent: 1.5 hours

import { Request, Response, NextFunction } from "express";
import jwt, { JsonWebTokenError, TokenExpiredError, NotBeforeError } from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";

// Ensure environment variables are loaded
dotenv.config();

// Get JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

// Validate that JWT_SECRET exists
if (!JWT_SECRET) {
  console.error("JWT_SECRET is not defined in environment variables!");
  // Don't exit process in case this is called during import
}

// Google OAuth client
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 
  "895573352563-bglvrv3e9visj279hc9g157787jd4on3.apps.googleusercontent.com";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

interface AuthenticatedRequest extends Request {
  user?: any;
}

/**
 * Middleware to authenticate JWT tokens from request headers
 */
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

    // Check if JWT_SECRET is available
    if (!JWT_SECRET) {
      console.error("JWT_SECRET is not defined but required for token verification!");
      return res.status(500).json({ error: "Server configuration error" });
    }
    
    // First try to verify as a JWT token
    try {
      const user = jwt.verify(token, JWT_SECRET);
      req.user = user;
      return next();
    } catch (error) {
      // Type guard the JWT error
      let jwtErrorMessage = "JWT verification failed";
      if (error instanceof JsonWebTokenError || 
          error instanceof TokenExpiredError || 
          error instanceof NotBeforeError) {
        jwtErrorMessage = error.message;
      } else if (error instanceof Error) {
        jwtErrorMessage = error.message;
      }
      
      console.log("JWT verification failed:", jwtErrorMessage);
      
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
        // Type guard the Google error
        let googleErrorMessage = "Google token verification failed";
        if (googleError instanceof Error) {
          googleErrorMessage = googleError.message;
        }
        
        console.error("Token verification failed:", {
          jwtError: jwtErrorMessage,
          googleError: googleErrorMessage
        });
        return res.status(403).json({ error: "Invalid token" });
      }
    }
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
};