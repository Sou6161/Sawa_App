/**
 * Authentication Middleware
 * 
 * Middleware to verify JWT tokens and protect routes
 */

import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { AppError } from "./errorHandler";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    userId: string; // Keep for backward compatibility
    email: string;
  };
}

/**
 * Middleware to verify JWT token
 */
export const authenticate = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("No token provided", 401);
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    try {
      const decoded = verifyToken(token);
      req.user = {
        id: decoded.userId,
        userId: decoded.userId, // Keep for backward compatibility
        email: decoded.email,
      };
      next();
    } catch (error) {
      throw new AppError("Invalid or expired token", 401);
    }
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError("Authentication failed", 401));
    }
  }
};

