/**
 * Story Routes
 */

import { Router } from "express";
import {
  uploadStory,
  getUserStories,
  likeStory,
  viewStory,
  deleteStory,
  cleanupExpiredStories,
  updateUserLocation,
  getNearbyStories,
  getMyLocation,
} from "../controllers/story.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// All story routes require authentication
router.use(authenticate);

// Story CRUD operations
router.post("/", uploadStory);
router.get("/", getUserStories);
router.get("/nearby", getNearbyStories);
router.get("/my-location", getMyLocation); // Debug endpoint to check user's location
router.post("/:storyId/like", likeStory);
router.post("/:storyId/view", viewStory);
router.delete("/:storyId", deleteStory);

// Location operations
router.post("/location", updateUserLocation);

// Admin/cleanup route (optional - can be called by cron job)
router.post("/cleanup", cleanupExpiredStories);

export default router;

