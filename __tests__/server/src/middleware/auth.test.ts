// src/middleware/auth.test.ts
import { Request, Response, NextFunction } from "express";
import { auth } from "@/server/src/config/firebase";
import {
  authenticateUser,
  isAdmin,
  isRestaurantOwner,
  isVanderbiltUser,
} from "@/server/src/middleware/auth";
import { FirebaseError } from "firebase/app";

// Mock Firebase Admin SDK
jest.mock("@/app/config/firebase", () => ({
  auth: {
    verifyIdToken: jest.fn(),
    getUser: jest.fn(),
  },
}));

describe("Authentication Middleware - Black Box Testing", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockReq = {
      headers: {},
      query: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  // Black box tests
  describe("authenticateUser - Black Box Tests", () => {
    // No token provided (fail case)
    it("should return 401 if no token is provided", async () => {
      await authenticateUser(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Unauthorized - No token provided",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    // Valid token in header (pass case)
    it("should accept token from Authorization header", async () => {
      const mockToken = "valid-token";
      const mockDecodedToken = { uid: "user123", role: "user" };
      const mockUserRecord = {
        uid: "user123",
        email: "test@example.com",
      };

      mockReq.headers = { authorization: `Bearer ${mockToken}` };
      (auth.verifyIdToken as jest.Mock).mockResolvedValue(mockDecodedToken);
      (auth.getUser as jest.Mock).mockResolvedValue(mockUserRecord);

      await authenticateUser(mockReq as Request, mockRes as Response, mockNext);

      expect(auth.verifyIdToken).toHaveBeenCalledWith(mockToken);
      expect(auth.getUser).toHaveBeenCalledWith(mockDecodedToken.uid);
      expect(mockReq.user).toEqual({
        uid: "user123",
        email: "test@example.com",
        role: "user",
      });
      expect(mockNext).toHaveBeenCalled();
    });


    // Expired token (boundary)
    it("should handle token expiration error", async () => {
      const mockToken = "expired-token";
      mockReq.headers = { authorization: `Bearer ${mockToken}` };

      const error = new Error("Token expired") as FirebaseError;
      Object.defineProperty(error, "code", {
        value: "auth/id-token-expired",
        writable: true,
      });
      (auth.verifyIdToken as jest.Mock).mockRejectedValue(error);

      await authenticateUser(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Token expired" });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("isAdmin - Black Box Tests", () => {
    // No user (fail case)
    it("should return 401 if user is not authenticated", () => {
      isAdmin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Unauthorized" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    // Admin user (pass case)
    it("should call next if user is admin", () => {
      mockReq.user = {
        uid: "admin123",
        email: "admin@example.com",
        role: "admin",
      };

      isAdmin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe("isVanderbiltUser - Black Box Tests", () => {
    // Non-Vanderbilt email (boundary)
    it("should return 403 if user does not have Vanderbilt email", () => {
      mockReq.user = {
        uid: "user123",
        email: "test@gmail.com",
        role: "user",
      };

      isVanderbiltUser(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Forbidden - Vanderbilt email required",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    // Vanderbilt email (pass case)
    it("should call next if user has Vanderbilt email", () => {
      mockReq.user = {
        uid: "user123",
        email: "test@vanderbilt.edu",
        role: "user",
      };

      isVanderbiltUser(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
});
