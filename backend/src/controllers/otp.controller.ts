/**
 * OTP Controller
 * 
 * Handles OTP generation and verification
 */

import { Request, Response, NextFunction } from "express";
import { prisma } from "../database";
import { generateOTP, getOTPExpiration, validateMobileNumber, normalizeMobileNumber, isOTPExpired } from "../utils/otp";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";

/**
 * Send OTP to mobile number
 */
export const sendOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      throw new AppError("Mobile number is required", 400);
    }

    // Validate mobile number format
    if (!validateMobileNumber(mobile)) {
      throw new AppError("Invalid mobile number format", 400);
    }

    const normalizedMobile = normalizeMobileNumber(mobile);

    // Check if mobile number is already registered
    const existingUser = await prisma.user.findUnique({
      where: { mobile: normalizedMobile },
    });

    if (existingUser) {
      throw new AppError("Mobile number already registered", 409);
    }

    // Generate OTP
    const otpCode = generateOTP();
    const expiresAt = getOTPExpiration();

    // Delete any existing OTPs for this mobile number
    await prisma.otp.deleteMany({
      where: { mobile: normalizedMobile },
    });

    // Create new OTP
    await prisma.otp.create({
      data: {
        mobile: normalizedMobile,
        code: otpCode,
        expiresAt,
      },
    });

    // In production, send OTP via SMS service
    // For now, log to console (backend terminal)
    logger.info(`📱 OTP for ${normalizedMobile}: ${otpCode}`);
    console.log(`\n📱 ============================================`);
    console.log(`📱 OTP for ${normalizedMobile}: ${otpCode}`);
    console.log(`📱 Expires at: ${expiresAt.toLocaleString()}`);
    console.log(`📱 ============================================\n`);

    res.json({
      success: true,
      message: "OTP sent successfully",
      data: {
        mobile: normalizedMobile,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP
 */
export const verifyOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { mobile, code } = req.body;

    if (!mobile || !code) {
      throw new AppError("Mobile number and OTP code are required", 400);
    }

    const normalizedMobile = normalizeMobileNumber(mobile);

    // Find OTP
    const otp = await prisma.otp.findFirst({
      where: {
        mobile: normalizedMobile,
        verified: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otp) {
      throw new AppError("OTP not found or already verified", 404);
    }

    // Check if OTP is expired
    if (isOTPExpired(otp.expiresAt)) {
      await prisma.otp.delete({
        where: { id: otp.id },
      });
      throw new AppError("OTP has expired. Please request a new one", 400);
    }

    // Verify OTP code
    if (otp.code !== code) {
      throw new AppError("Invalid OTP code", 400);
    }

    // Mark OTP as verified
    await prisma.otp.update({
      where: { id: otp.id },
      data: { verified: true },
    });

    res.json({
      success: true,
      message: "Mobile number verified successfully",
      data: {
        mobile: normalizedMobile,
        verified: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resend OTP
 */
export const resendOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      throw new AppError("Mobile number is required", 400);
    }

    const normalizedMobile = normalizeMobileNumber(mobile);

    // Delete existing OTPs
    await prisma.otp.deleteMany({
      where: { mobile: normalizedMobile },
    });

    // Generate and send new OTP (reuse sendOTP logic)
    const otpCode = generateOTP();
    const expiresAt = getOTPExpiration();

    await prisma.otp.create({
      data: {
        mobile: normalizedMobile,
        code: otpCode,
        expiresAt,
      },
    });

    // Log to console
    logger.info(`📱 Resent OTP for ${normalizedMobile}: ${otpCode}`);
    console.log(`\n📱 ============================================`);
    console.log(`📱 Resent OTP for ${normalizedMobile}: ${otpCode}`);
    console.log(`📱 Expires at: ${expiresAt.toLocaleString()}`);
    console.log(`📱 ============================================\n`);

    res.json({
      success: true,
      message: "OTP resent successfully",
      data: {
        mobile: normalizedMobile,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

