/**
 * Story Controller
 * 
 * Handles story upload, retrieval, likes, views, and deletion
 */

import { Request, Response, NextFunction } from "express";
import { prisma } from "../database";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";

/**
 * Upload a new story
 */
export const uploadStory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    let { imageUrl, location, locationAddress } = req.body;

    if (!imageUrl) {
      throw new AppError("Image URL is required", 400);
    }

    // Handle base64 data URLs (for MVP - in production, upload to cloud storage first)
    // If imageUrl is a base64 data URL, we'll store it as-is in the database
    // In production, you'd upload to S3/Cloudinary and get a URL
    // For now, we accept base64 data URLs and store them directly
    if (!imageUrl.startsWith('data:image/') && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      throw new AppError("Invalid image format. Expected base64 data URL or HTTP/HTTPS URL", 400);
    }

    // Create story with 24-hour expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const story = await prisma.story.create({
      data: {
        userId,
        imageUrl,
        location: location || null,
        locationAddress: locationAddress || null,
        expiresAt,
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
    });

    res.status(201).json({
      success: true,
      data: {
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
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get user's active stories
 */
export const getUserStories = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    // Get active stories (not expired)
    const now = new Date();
    const stories = await prisma.story.findMany({
      where: {
        userId,
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

    // Return the most recent story (Instagram shows only one active story per user)
    const latestStory = stories[0];

    if (!latestStory) {
      res.json({
        success: true,
        data: null,
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: latestStory.id,
        userId: latestStory.userId,
        imageUrl: latestStory.imageUrl,
        location: latestStory.location
          ? {
              name: latestStory.location,
              address: latestStory.locationAddress,
            }
          : undefined,
        likesCount: latestStory.likesCount,
        viewsCount: latestStory.viewsCount,
        expiresAt: latestStory.expiresAt.getTime(),
        createdAt: latestStory.createdAt.getTime(),
        userName: latestStory.user.name || latestStory.user.email?.split("@")[0] || "User",
        userProfilePhoto: latestStory.user.profilePhoto,
        userGender: latestStory.user.gender,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Like a story
 */
export const likeStory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const { storyId } = req.params;

    if (!storyId) {
      throw new AppError("Story ID is required", 400);
    }

    // Check if story exists and is not expired
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new AppError("Story not found", 404);
    }

    if (story.expiresAt < new Date()) {
      throw new AppError("Story has expired", 410);
    }

    // Check if user already liked this story
    const existingLike = await prisma.storyLike.findUnique({
      where: {
        storyId_userId: {
          storyId,
          userId,
        },
      },
    });

    if (existingLike) {
      // Unlike: remove like and decrement count
      await prisma.storyLike.delete({
        where: {
          id: existingLike.id,
        },
      });

      await prisma.story.update({
        where: { id: storyId },
        data: {
          likesCount: {
            decrement: 1,
          },
        },
      });

      res.json({
        success: true,
        message: "Story unliked",
        liked: false,
      });
    } else {
      // Like: add like and increment count
      await prisma.storyLike.create({
        data: {
          storyId,
          userId,
        },
      });

      await prisma.story.update({
        where: { id: storyId },
        data: {
          likesCount: {
            increment: 1,
          },
        },
      });

      res.json({
        success: true,
        message: "Story liked",
        liked: true,
      });
    }
  } catch (error: any) {
    next(error);
  }
};

/**
 * Mark story as viewed
 */
export const viewStory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const { storyId } = req.params;

    if (!storyId) {
      throw new AppError("Story ID is required", 400);
    }

    // Check if story exists and is not expired
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new AppError("Story not found", 404);
    }

    if (story.expiresAt < new Date()) {
      throw new AppError("Story has expired", 410);
    }

    // Don't mark your own story as viewed (you're the creator)
    if (story.userId === userId) {
      res.json({
        success: true,
        message: "Story viewed (own story, view not tracked)",
      });
      return;
    }

    // Check if user already viewed this story
    const existingView = await prisma.storyView.findUnique({
      where: {
        storyId_userId: {
          storyId,
          userId,
        },
      },
    });

    if (!existingView) {
      // Add view and increment count
      await prisma.storyView.create({
        data: {
          storyId,
          userId,
        },
      });

      await prisma.story.update({
        where: { id: storyId },
        data: {
          viewsCount: {
            increment: 1,
          },
        },
      });
    }

    res.json({
      success: true,
      message: "Story viewed",
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Delete a story
 */
export const deleteStory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const { storyId } = req.params;

    if (!storyId) {
      throw new AppError("Story ID is required", 400);
    }

    // Check if story exists and belongs to user
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new AppError("Story not found", 404);
    }

    if (story.userId !== userId) {
      throw new AppError("Unauthorized to delete this story", 403);
    }

    // Delete story (cascade will delete likes and views)
    await prisma.story.delete({
      where: { id: storyId },
    });

    res.json({
      success: true,
      message: "Story deleted successfully",
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Cleanup expired stories (can be called by a cron job)
 */
export const cleanupExpiredStories = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const now = new Date();
    
    // Delete expired stories (cascade will delete related likes and views)
    const result = await prisma.story.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    logger.info(`Cleaned up ${result.count} expired stories`);

    res.json({
      success: true,
      message: `Cleaned up ${result.count} expired stories`,
      count: result.count,
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Update user location
 */
export const updateUserLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      throw new AppError("Latitude and longitude are required", 400);
    }

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      throw new AppError("Latitude and longitude must be numbers", 400);
    }

    // Validate latitude and longitude ranges
    if (latitude < -90 || latitude > 90) {
      throw new AppError("Latitude must be between -90 and 90", 400);
    }
    if (longitude < -180 || longitude > 180) {
      throw new AppError("Longitude must be between -180 and 180", 400);
    }

    // Update user location
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        latitude,
        longitude,
        locationUpdatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        latitude: true,
        longitude: true,
        locationUpdatedAt: true,
      },
    });

    console.log(`📍 Location updated for user ${userId}:`, {
      userId,
      email: updatedUser.email,
      name: updatedUser.name,
      latitude: updatedUser.latitude,
      longitude: updatedUser.longitude,
      locationUpdatedAt: updatedUser.locationUpdatedAt,
    });

    res.json({
      success: true,
      message: "Location updated successfully",
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get current user's location (for debugging)
 */
export const getMyLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        latitude: true,
        longitude: true,
        locationUpdatedAt: true,
        _count: {
          select: {
            stories: {
              where: {
                expiresAt: { gt: new Date() },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        name: user.name,
        latitude: user.latitude,
        longitude: user.longitude,
        locationUpdatedAt: user.locationUpdatedAt,
        hasActiveStories: user._count.stories > 0,
        activeStoryCount: user._count.stories,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get nearby users with active stories
 */
export const getNearbyStories = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const { latitude, longitude, radius = 10 } = req.query; // radius in kilometers, default 10km

    if (!latitude || !longitude) {
      throw new AppError("Latitude and longitude are required", 400);
    }

    const userLat = parseFloat(latitude as string);
    const userLon = parseFloat(longitude as string);
    const radiusKm = parseFloat(radius as string) || 10;

    if (isNaN(userLat) || isNaN(userLon)) {
      throw new AppError("Invalid latitude or longitude", 400);
    }

    // Use provided coordinates (latitude and longitude are passed from frontend)
    const searchLat = userLat;
    const searchLon = userLon;

    // Calculate bounding box for nearby search (approximate)
    // 1 degree latitude ≈ 111 km
    // 1 degree longitude ≈ 111 km * cos(latitude)
    const latDelta = radiusKm / 111;
    const lonDelta = radiusKm / (111 * Math.cos((searchLat * Math.PI) / 180));

    const minLat = searchLat - latDelta;
    const maxLat = searchLat + latDelta;
    const minLon = searchLon - lonDelta;
    const maxLon = searchLon + lonDelta;

    // Find users within the bounding box who have active stories
    const now = new Date();
    
    // First, let's check all users with active stories and their locations (for debugging)
    const allUsersWithStories = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: userId } },
          {
            stories: {
              some: {
                expiresAt: { gt: now },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        latitude: true,
        longitude: true,
        locationUpdatedAt: true,
        _count: {
          select: {
            stories: {
              where: {
                expiresAt: { gt: now },
              },
            },
          },
        },
      },
    });
    
    // Log all users with active stories (for debugging)
    console.log(`\n📊 ===== DIAGNOSTIC: All users with active stories (excluding current user ${userId}) =====`);
    console.log(`Current user location: ${searchLat}, ${searchLon}`);
    console.log(`Total users with active stories: ${allUsersWithStories.length}`);
    
    if (allUsersWithStories.length === 0) {
      console.log('⚠️ NO OTHER USERS HAVE ACTIVE STORIES!');
      console.log('This means either:');
      console.log('  1. The other account has no stories uploaded');
      console.log('  2. The other account\'s stories have expired');
      console.log('  3. There is only one account in the database');
    } else {
      allUsersWithStories.forEach((u, index) => {
        const hasLocation = u.latitude !== null && u.longitude !== null;
        const distance = hasLocation ? (() => {
          const R = 6371;
          const dLat = ((u.latitude! - searchLat) * Math.PI) / 180;
          const dLon = ((u.longitude! - searchLon) * Math.PI) / 180;
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((searchLat * Math.PI) / 180) * Math.cos((u.latitude! * Math.PI) / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return Math.round(R * c * 10) / 10;
        })() : 'N/A';
        
        console.log(`\nUser ${index + 1}:`);
        console.log(`  ID: ${u.id}`);
        console.log(`  Name: ${u.name || u.email?.split('@')[0] || 'Unknown'}`);
        console.log(`  Email: ${u.email}`);
        console.log(`  Has Location: ${hasLocation ? 'YES ✅' : 'NO ❌'}`);
        if (hasLocation) {
          console.log(`  Location: ${u.latitude}, ${u.longitude}`);
          console.log(`  Distance: ${distance} km`);
          console.log(`  Location Updated: ${u.locationUpdatedAt}`);
        }
        console.log(`  Active Stories: ${u._count.stories}`);
      });
    }
    console.log(`\n📊 ===== END DIAGNOSTIC =====\n`);
    
    // Debug logging - MUST appear before diagnostic
    console.log(`\n🔍 ===== SEARCHING FOR NEARBY STORIES =====`);
    console.log(`User ID: ${userId}`);
    console.log(`Search Location: ${searchLat}, ${searchLon}`);
    console.log(`Search Radius: ${radiusKm} km`);
    console.log(`Bounding Box: lat [${minLat.toFixed(6)}, ${maxLat.toFixed(6)}], lon [${minLon.toFixed(6)}, ${maxLon.toFixed(6)}]`);
    console.log(`==========================================\n`);
    
    const nearbyUsers = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: userId } }, // Exclude current user
          { latitude: { not: null }, longitude: { not: null } }, // Only users with location set
          { latitude: { gte: minLat, lte: maxLat } },
          { longitude: { gte: minLon, lte: maxLon } },
          {
            stories: {
              some: {
                expiresAt: { gt: now }, // Has active stories
              },
            },
          },
        ],
      },
      include: {
        stories: {
          where: {
            expiresAt: { gt: now },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1, // Get only the latest story per user (like Instagram)
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profilePhoto: true,
              },
            },
          },
        },
      },
    });
    
    console.log(`👥 Found ${nearbyUsers.length} users within bounding box with active stories:`, {
      count: nearbyUsers.length,
      boundingBox: { minLat, maxLat, minLon, maxLon },
      users: nearbyUsers.map(u => ({
        id: u.id,
        name: u.name || u.email?.split('@')[0],
        latitude: u.latitude,
        longitude: u.longitude,
        storyCount: u.stories.length,
        // Calculate actual distance
        actualDistance: (() => {
          const R = 6371;
          const dLat = ((u.latitude! - searchLat) * Math.PI) / 180;
          const dLon = ((u.longitude! - searchLon) * Math.PI) / 180;
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((searchLat * Math.PI) / 180) * Math.cos((u.latitude! * Math.PI) / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return Math.round(R * c * 10) / 10;
        })(),
      })),
    });

    // Calculate distance and format response
    const storiesWithDistance = nearbyUsers
      .filter((user) => user.stories.length > 0)
      .map((user) => {
        const story = user.stories[0];
        
        // Calculate distance using Haversine formula
        const R = 6371; // Earth's radius in km
        const dLat = ((user.latitude! - searchLat) * Math.PI) / 180;
        const dLon = ((user.longitude! - searchLon) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((searchLat * Math.PI) / 180) *
            Math.cos((user.latitude! * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return {
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
          distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
        };
      })
      .sort((a, b) => a.distance - b.distance); // Sort by distance

    // Debug logging
    console.log(`✅ Found ${storiesWithDistance.length} nearby stories:`, {
      count: storiesWithDistance.length,
      searchParams: { searchLat, searchLon, radiusKm },
      boundingBox: { minLat, maxLat, minLon, maxLon },
      stories: storiesWithDistance.map(s => ({
        userId: s.userId,
        userName: s.userName,
        distance: s.distance,
      })),
    });

    res.json({
      success: true,
      data: storiesWithDistance,
    });
  } catch (error: any) {
    next(error);
  }
};

