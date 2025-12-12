/**
 * Authentication Routes
 */

import { Router } from "express";
import {
  signup,
  signin,
  getProfile,
  verifyToken,
  saveCategories,
  updateProfile,
} from "../controllers/auth.controller";
import { validateSignup, validateLogin } from "../middleware/validate";
import { authenticate } from "../middleware/auth";

const router = Router();

// Public routes
router.post("/signup", validateSignup, signup);
router.post("/signin", validateLogin, signin);

// Protected routes
router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateProfile);
router.get("/verify", authenticate, verifyToken);
router.post("/categories", authenticate, saveCategories);

export const authRoutes = router;

