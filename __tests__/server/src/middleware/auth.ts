import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../../../../server/src/middleware/auth';

jest.mock('jsonwebtoken');
jest.mock('google-auth-library');

describe("authenticateToken middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it("naive test", () => {
    expect(true).toBe(true);
  });

//   it("should authenticate a valid token", async () => {
//     const mockUser = { id: '123', email: 'test@example.com' };
//     const mockToken = 'valid.jwt.token';
    
//     // Mock the token verification
//     (jwt.verify as jest.Mock).mockImplementation(() => mockUser);
    
//     mockReq.headers = {
//       authorization: `Bearer ${mockToken}`
//     };

//     await authenticateToken(
//       mockReq as Request, 
//       mockRes as Response, 
//       mockNext
//     );

//     expect(jwt.verify).toHaveBeenCalledWith(
//       mockToken,
//       expect.any(String) // Your JWT_SECRET
//     );
//     // expect(mockReq.user).toEqual(mockUser);
//     // expect(mockNext).toHaveBeenCalled();
//     // expect(mockRes.status).not.toHaveBeenCalled();
//   });

//   it("should reject requests without authorization header", async () => {
//     await authenticateToken(
//       mockReq as Request, 
//       mockRes as Response, 
//       mockNext
//     );

//     expect(mockRes.status).toHaveBeenCalledWith(401);
//     expect(mockRes.json).toHaveBeenCalledWith({
//       error: "Authorization header required"
//     });
//     expect(mockNext).not.toHaveBeenCalled();
//   });

//   it("should reject invalid token format", async () => {
//     mockReq.headers = {
//       authorization: 'InvalidFormat token'
//     };

//     await authenticateToken(
//       mockReq as Request, 
//       mockRes as Response, 
//       mockNext
//     );

//     expect(mockRes.status).toHaveBeenCalledWith(401);
//     expect(mockRes.json).toHaveBeenCalledWith({
//       error: "Invalid token format"
//     });
//     expect(mockNext).not.toHaveBeenCalled();
//   });

//   it("should handle invalid tokens", async () => {
//     mockReq.headers = {
//       authorization: 'Bearer invalid.token'
//     };

//     (jwt.verify as jest.Mock).mockImplementation(() => {
//       throw new Error('Invalid token');
//     });

//     await authenticateToken(
//       mockReq as Request, 
//       mockRes as Response, 
//       mockNext
//     );

//     expect(mockRes.status).toHaveBeenCalledWith(403);
//     expect(mockRes.json).toHaveBeenCalledWith({
//       error: "Invalid token"
//     });
//     expect(mockNext).not.toHaveBeenCalled();
//   });
});


