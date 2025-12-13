/**
 * Authentication Routes
 */

import { Router } from "express";
import {
  signup,
  signin,
  getProfile,
  getUserProfile,
  verifyToken,
  saveCategories,
  updateProfile,
  searchUsers,
} from "../controllers/auth.controller";
import { validateSignup, validateLogin } from "../middleware/validate";
import { authenticate } from "../middleware/auth";

const router = Router();

// Public routes
router.post("/signup", validateSignup, signup);
router.post("/signin", validateLogin, signin);

// Protected routes
router.get("/profile", authenticate, getProfile);
router.get("/profile/:userId", authenticate, getUserProfile);
router.get("/search", authenticate, searchUsers);
router.put("/profile", authenticate, updateProfile);
router.get("/verify", authenticate, verifyToken);
router.post("/categories", authenticate, saveCategories);

export const authRoutes = router;

