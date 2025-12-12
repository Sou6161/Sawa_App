import { Router } from "express";
import { healthRoutes } from "./health.routes";
import { authRoutes } from "./auth.routes";
import { otpRoutes } from "./otp.routes";
import { logger } from "../utils/logger";

const router = Router();

// Mount route modules
router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/otp", otpRoutes);

// Debug: Log mounted routes
logger.info("Routes mounted: /health, /auth, /otp");

// Add more route modules here as your API grows
// router.use("/users", userRoutes);

export default router;

