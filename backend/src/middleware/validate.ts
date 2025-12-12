/**
 * Validation Middleware
 * 
 * Middleware for validating request data
 */

import { Request, Response, NextFunction } from "express";
import { AppError } from "./errorHandler";

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 6) {
    return { valid: false, message: "Password must be at least 6 characters" };
  }
  return { valid: true };
};

/**
 * Middleware to validate signup data
 */
export const validateSignup = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const { email, password, mobile } = req.body;

  if (!email || !password) {
    return next(new AppError("Email and password are required", 400));
  }

  if (!mobile) {
    return next(new AppError("Mobile number is required", 400));
  }

  if (!validateEmail(email)) {
    return next(new AppError("Invalid email format", 400));
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return next(new AppError(passwordValidation.message || "Invalid password", 400));
  }

  next();
};

/**
 * Middleware to validate login data
 */
export const validateLogin = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Email and password are required", 400));
  }

  if (!validateEmail(email)) {
    return next(new AppError("Invalid email format", 400));
  }

  next();
};

