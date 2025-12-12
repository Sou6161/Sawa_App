/**
 * OTP Routes
 */

import { Router } from "express";
import {
  sendOTP,
  verifyOTP,
  resendOTP,
} from "../controllers/otp.controller";

const router = Router();

// OTP routes
router.post("/send", sendOTP);
router.post("/verify", verifyOTP);
router.post("/resend", resendOTP);

export const otpRoutes = router;

