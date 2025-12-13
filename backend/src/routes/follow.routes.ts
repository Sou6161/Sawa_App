/**
 * Follow Routes
 */

import { Router } from "express";
import {
  followUser,
  unfollowUser,
  checkFollowStatus,
  getFollowingStories,
  getFollowersCount,
  getFollowingCount,
} from "../controllers/follow.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// All follow routes require authentication
router.use(authenticate);

// Follow/unfollow operations
router.post("/", followUser);
router.post("/unfollow", unfollowUser);
router.get("/check/:userId", checkFollowStatus);
router.get("/stories", getFollowingStories);
router.get("/followers/:userId", getFollowersCount);
router.get("/following/:userId", getFollowingCount);

export default router;

