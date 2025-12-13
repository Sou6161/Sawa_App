/**
 * Follow Controller
 * 
 * Handles follow/unfollow functionality and getting followed users' stories
 */

import { Request, Response, NextFunction } from "express";
import { prisma } from "../database";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";

/**
 * Follow a user
 */
export const followUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const { followingId } = req.body;

    if (!followingId) {
      throw new AppError("Following user ID is required", 400);
    }

    if (userId === followingId) {
      throw new AppError("Cannot follow yourself", 400);
    }

    // Check if user exists
    const userToFollow = await prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!userToFollow) {
      throw new AppError("User not found", 404);
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: followingId,
        },
      },
    });

    if (existingFollow) {
      throw new AppError("Already following this user", 400);
    }

    // Create follow relationship
    await prisma.follow.create({
      data: {
        followerId: userId,
        followingId: followingId,
      },
    });

    logger.info(`User ${userId} followed user ${followingId}`);

    res.json({
      success: true,
      message: "User followed successfully",
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Unfollow a user
 */
export const unfollowUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const { followingId } = req.body;

    if (!followingId) {
      throw new AppError("Following user ID is required", 400);
    }

    // Check if following relationship exists
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: followingId,
        },
      },
    });

    if (!existingFollow) {
      throw new AppError("Not following this user", 400);
    }

    // Delete follow relationship
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: followingId,
        },
      },
    });

    logger.info(`User ${userId} unfollowed user ${followingId}`);

    res.json({
      success: true,
      message: "User unfollowed successfully",
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Check if current user follows a specific user
 */
export const checkFollowStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const { userId: targetUserId } = req.params;

    if (!targetUserId) {
      throw new AppError("User ID is required", 400);
    }

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetUserId,
        },
      },
    });

    res.json({
      success: true,
      data: {
        isFollowing: !!follow,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get stories from users that the current user follows
 */
export const getFollowingStories = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const now = new Date();

    // Get all users that the current user follows
    const following = await prisma.follow.findMany({
      where: {
        followerId: userId,
      },
      select: {
        followingId: true,
      },
    });

    const followingIds = following.map((f) => f.followingId);

    if (followingIds.length === 0) {
      res.json({
        success: true,
        data: [],
      });
      return;
    }

    // Get active stories from followed users
    const stories = await prisma.story.findMany({
      where: {
        userId: {
          in: followingIds,
        },
        expiresAt: {
          gt: now,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePhoto: true,
            gender: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Group stories by user (like Instagram - show latest story per user)
    const storiesByUser = new Map<string, typeof stories[0]>();
    stories.forEach((story) => {
      const existing = storiesByUser.get(story.userId);
      if (!existing || story.createdAt > existing.createdAt) {
        storiesByUser.set(story.userId, story);
      }
    });

    const formattedStories = Array.from(storiesByUser.values()).map((story) => ({
      id: story.id,
      userId: story.userId,
      imageUrl: story.imageUrl,
      location: story.location
        ? {
            name: story.location,
            address: story.locationAddress || undefined,
          }
        : undefined,
      likesCount: story.likesCount,
      viewsCount: story.viewsCount,
      expiresAt: story.expiresAt.getTime(),
      createdAt: story.createdAt.getTime(),
      userName: story.user.name || story.user.email?.split("@")[0] || "User",
      userProfilePhoto: story.user.profilePhoto,
      userGender: story.user.gender,
    }));

    res.json({
      success: true,
      data: formattedStories,
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get user's followers count
 */
export const getFollowersCount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;

    const count = await prisma.follow.count({
      where: {
        followingId: userId,
      },
    });

    res.json({
      success: true,
      data: {
        count,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get user's following count
 */
export const getFollowingCount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;

    const count = await prisma.follow.count({
      where: {
        followerId: userId,
      },
    });

    res.json({
      success: true,
      data: {
        count,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

