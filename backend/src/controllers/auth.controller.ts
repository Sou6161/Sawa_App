/**
 * Authentication Controller
 * 
 * Handles authentication-related requests
 */

import { Request, Response, NextFunction } from "express";
import { prisma } from "../database";
import { hashPassword, comparePassword } from "../utils/password";
import { generateToken } from "../utils/jwt";
import { AppError } from "../middleware/errorHandler";
import { normalizeMobileNumber } from "../utils/otp";

/**
 * Sign up a new user
 */
export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, name, mobile } = req.body;

    if (!mobile) {
      throw new AppError("Mobile number is required", 400);
    }

    const normalizedMobile = normalizeMobileNumber(mobile);

    // Verify that mobile number has been verified via OTP
    const verifiedOTP = await prisma.otp.findFirst({
      where: {
        mobile: normalizedMobile,
        verified: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!verifiedOTP) {
      throw new AppError("Mobile number must be verified before signup", 400);
    }

    // Check if user already exists by email
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      throw new AppError("User with this email already exists", 409);
    }

    // Check if user already exists by mobile
    const existingUserByMobile = await prisma.user.findUnique({
      where: { mobile: normalizedMobile },
    });

    if (existingUserByMobile) {
      throw new AppError("User with this mobile number already exists", 409);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        mobile: normalizedMobile,
        password: hashedPassword,
        name: name || undefined,
        mobileVerified: true,
      },
      select: {
        id: true,
        email: true,
        mobile: true,
        name: true,
        profilePhoto: true,
        categories: true,
        categoriesCompleted: true,
        instagramHandle: true,
        createdAt: true,
      },
    });

    // Delete verified OTP after successful signup
    await prisma.otp.deleteMany({
      where: {
        mobile: normalizedMobile,
        verified: true,
      },
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    res.status(201).json({
      success: true,
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Sign in an existing user
 */
export const signin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401);
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profilePhoto: user.profilePhoto || undefined,
          categories: user.categories || [],
          categoriesCompleted: user.categoriesCompleted || false,
          instagramHandle: user.instagramHandle || undefined,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id || authReq.user?.userId;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        profilePhoto: true,
        categories: true,
        categoriesCompleted: true,
        instagramHandle: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify token endpoint
 */
export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as any;
    const user = authReq.user;

    if (!user) {
      throw new AppError("Token invalid or expired", 401);
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Save user categories
 */
export const saveCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const { categories } = req.body;

    if (!Array.isArray(categories)) {
      throw new AppError("Categories must be an array", 400);
    }

    if (categories.length === 0) {
      throw new AppError("At least one category must be selected", 400);
    }

    if (categories.length > 8) {
      throw new AppError("Maximum 8 categories allowed", 400);
    }

    // Update user with categories
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        categories: categories,
        categoriesCompleted: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        profilePhoto: true,
        categories: true,
        categoriesCompleted: true,
        instagramHandle: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id || authReq.user?.userId;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const { name, profilePhoto, categories, instagramHandle } = req.body;

    // Build update data object
    const updateData: any = {};

    if (name !== undefined) {
      if (!name.trim()) {
        throw new AppError("Name cannot be empty", 400);
      }
      updateData.name = name.trim();
    }

    if (profilePhoto !== undefined) {
      updateData.profilePhoto = profilePhoto;
    }

    if (categories !== undefined) {
      if (!Array.isArray(categories)) {
        throw new AppError("Categories must be an array", 400);
      }

      if (categories.length > 8) {
        throw new AppError("Maximum 8 categories allowed", 400);
      }

      updateData.categories = categories;
      updateData.categoriesCompleted = categories.length > 0;
    }

    if (instagramHandle !== undefined) {
      // Remove @ if user included it
      const cleanedHandle = instagramHandle.trim().replace(/^@/, "");
      if (cleanedHandle) {
        // Validate Instagram handle format (alphanumeric, dots, underscores, 1-30 chars)
        if (!/^[a-zA-Z0-9._]{1,30}$/.test(cleanedHandle)) {
          throw new AppError("Invalid Instagram handle format", 400);
        }
        updateData.instagramHandle = cleanedHandle;
      } else {
        updateData.instagramHandle = null;
      }
    }

    // Update user profile
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        profilePhoto: true,
        categories: true,
        categoriesCompleted: true,
        instagramHandle: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

