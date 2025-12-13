import express, { Express, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFoundHandler";
import { connectDatabase, disconnectDatabase, checkDatabaseHealth } from "./database";
import apiRoutes from "./routes";

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || "development";

// Security middleware
app.use(helmet());

// CORS configuration for mobile app
// In production, mobile apps don't use CORS, but we keep it for development (Expo web)
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(",") || [
    "http://localhost:8081", // Expo web dev server
    "exp://localhost:8081", // Expo Go
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Compression middleware
app.use(compression());

// Logging middleware
if (NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Health check endpoint
app.get("/health", async (_req: Request, res: Response) => {
  const dbHealth = await checkDatabaseHealth();
  res.status(dbHealth ? 200 : 503).json({
    status: dbHealth ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    database: dbHealth ? "connected" : "disconnected",
  });
});

// API routes
const API_PREFIX = process.env.API_PREFIX || "/api";
app.use(API_PREFIX, apiRoutes);

// Debug: Log available routes in development
if (NODE_ENV === "development") {
  console.log("📋 Available API routes:");
  console.log(`   GET  ${API_PREFIX}/health`);
  console.log(`   POST ${API_PREFIX}/auth/signup`);
  console.log(`   POST ${API_PREFIX}/auth/signin`);
  console.log(`   GET  ${API_PREFIX}/auth/profile`);
  console.log(`   PUT  ${API_PREFIX}/auth/profile`);
  console.log(`   GET  ${API_PREFIX}/auth/verify`);
  console.log(`   POST ${API_PREFIX}/auth/categories`);
  console.log(`   POST ${API_PREFIX}/otp/send`);
  console.log(`   POST ${API_PREFIX}/otp/verify`);
  console.log(`   POST ${API_PREFIX}/otp/resend`);
  console.log(`   POST ${API_PREFIX}/stories`);
  console.log(`   GET  ${API_PREFIX}/stories`);
  console.log(`   GET  ${API_PREFIX}/stories/nearby`);
  console.log(`   POST ${API_PREFIX}/stories/location`);
  console.log(`   POST ${API_PREFIX}/stories/:storyId/like`);
  console.log(`   POST ${API_PREFIX}/stories/:storyId/view`);
  console.log(`   DELETE ${API_PREFIX}/stories/:storyId`);
  console.log(`   POST ${API_PREFIX}/follow`);
  console.log(`   DELETE ${API_PREFIX}/follow`);
  console.log(`   GET  ${API_PREFIX}/follow/check/:userId`);
  console.log(`   GET  ${API_PREFIX}/follow/stories`);
  console.log(`   GET  ${API_PREFIX}/follow/followers/:userId`);
  console.log(`   GET  ${API_PREFIX}/follow/following/:userId`);
}

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server with database connection
const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${NODE_ENV}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API endpoint: http://localhost:${PORT}${API_PREFIX}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  await disconnectDatabase();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  await disconnectDatabase();
  process.exit(0);
});

// Start the server
startServer();

export default app;

