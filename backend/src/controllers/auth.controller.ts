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
import { generateDefaultAvatar } from "../utils/defaultAvatar";

/**
 * Sign up a new user
 */
export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, name, mobile, gender } = req.body;

    if (!mobile) {
      throw new AppError("Mobile number is required", 400);
    }

    // Validate gender if provided
    if (gender && !["male", "female"].includes(gender.toLowerCase())) {
      throw new AppError("Gender must be either 'male' or 'female'", 400);
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

    // Generate default avatar if no profile photo provided
    const defaultProfilePhoto = generateDefaultAvatar(gender);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        mobile: normalizedMobile,
        password: hashedPassword,
        name: name || undefined,
        gender: gender ? gender.toLowerCase() : undefined,
        profilePhoto: defaultProfilePhoto, // Set default avatar automatically
        mobileVerified: true,
      },
      select: {
        id: true,
        email: true,
        mobile: true,
        name: true,
        profilePhoto: true,
        gender: true,
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

    // If user has no profile photo, set a default one
    let profilePhoto = user.profilePhoto;
    if (!profilePhoto) {
      const defaultProfilePhoto = generateDefaultAvatar(user.gender);
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { profilePhoto: defaultProfilePhoto },
        select: { profilePhoto: true },
      });
      profilePhoto = updatedUser.profilePhoto;
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
          profilePhoto: profilePhoto || undefined,
          gender: user.gender || undefined,
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

    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        profilePhoto: true,
        gender: true,
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

    // If user has no profile photo, set a default one
    if (!user.profilePhoto) {
      const defaultProfilePhoto = generateDefaultAvatar(user.gender);
      user = await prisma.user.update({
        where: { id: userId },
        data: { profilePhoto: defaultProfilePhoto },
        select: {
          id: true,
          email: true,
          name: true,
          profilePhoto: true,
          gender: true,
          categories: true,
          categoriesCompleted: true,
          instagramHandle: true,
          createdAt: true,
          updatedAt: true,
        },
      });
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
 * Get user profile by ID (public profile view)
 */
export const getUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        profilePhoto: true,
        gender: true,
        categories: true,
        instagramHandle: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Search users by name, email, or username
 */
export const searchUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const { query, limit = 20 } = req.query;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      res.json({
        success: true,
        data: [],
      });
      return;
    }

    const searchQuery = query.trim().toLowerCase();
    const searchLimit = Math.min(parseInt(limit as string) || 20, 50); // Max 50 results

    // Search users by name, email, or instagram handle
    // Exclude the current user
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: userId } }, // Exclude current user
          {
            OR: [
              { name: { contains: searchQuery, mode: "insensitive" } },
              { email: { contains: searchQuery, mode: "insensitive" } },
              { instagramHandle: { contains: searchQuery, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        profilePhoto: true,
        instagramHandle: true,
        categories: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            stories: {
              where: {
                expiresAt: { gt: new Date() },
              },
            },
          },
        },
      },
      take: searchLimit,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Check follow status for each user
    const userIds = users.map((u) => u.id);
    const followRelations = await prisma.follow.findMany({
      where: {
        followerId: userId,
        followingId: { in: userIds },
      },
      select: {
        followingId: true,
      },
    });

    const followingIds = new Set(followRelations.map((f) => f.followingId));

    // Format response with follow status
    const usersWithFollowStatus = users.map((user) => ({
      id: user.id,
      name: user.name || user.email?.split("@")[0] || "User",
      email: user.email,
      profilePhoto: user.profilePhoto,
      instagramHandle: user.instagramHandle,
      categories: user.categories,
      gender: user.gender,
      followersCount: user._count.followers,
      followingCount: user._count.following,
      hasActiveStory: user._count.stories > 0,
      isFollowing: followingIds.has(user.id),
      createdAt: user.createdAt,
    }));

    res.json({
      success: true,
      data: usersWithFollowStatus,
    });
  } catch (error: any) {
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
        gender: true,
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
        gender: true,
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

