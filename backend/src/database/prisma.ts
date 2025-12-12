/**
 * Prisma Client Singleton
 * 
 * This file creates a singleton instance of Prisma Client to be used
 * throughout the application. This prevents multiple instances and
 * connection pool exhaustion.
 */

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { logger } from "../utils/logger";
import dotenv from "dotenv";

// Ensure environment variables are loaded
dotenv.config();

// Create PostgreSQL connection pool
// Parse DATABASE_URL to ensure correct connection
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Verify the database URL contains the correct database name
if (!databaseUrl.includes("/sawa_db")) {
  logger.warn(`DATABASE_URL might be incorrect. Expected to contain '/sawa_db', got: ${databaseUrl}`);
}

const pool = new Pool({
  connectionString: databaseUrl,
  // Explicitly set connection parameters
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Create Prisma adapter
const adapter = new PrismaPg(pool);

class PrismaClientSingleton {
  private static instance: PrismaClient;
  private static isConnected = false;

  static getInstance(): PrismaClient {
    if (!PrismaClientSingleton.instance) {
      PrismaClientSingleton.instance = new PrismaClient({
        adapter,
        log:
          process.env.NODE_ENV === "development"
            ? [
                { level: "query", emit: "event" },
                { level: "error", emit: "stdout" },
                { level: "warn", emit: "stdout" },
              ]
            : [{ level: "error", emit: "stdout" }],
      });

      // Log queries in development
      if (process.env.NODE_ENV === "development") {
        PrismaClientSingleton.instance.$on("query" as never, (e: unknown) => {
          const event = e as { query: string; params: string; duration: number };
          logger.debug("Query", {
            query: event.query,
            params: event.params,
            duration: `${event.duration}ms`,
          });
        });
      }
    }
    return PrismaClientSingleton.instance;
  }

  static async connect(): Promise<void> {
    if (!PrismaClientSingleton.isConnected) {
      try {
        // Test connection with a simple query
        await PrismaClientSingleton.getInstance().$queryRaw`SELECT 1`;
        PrismaClientSingleton.isConnected = true;
        logger.info("✅ Database connected successfully");
      } catch (error) {
        logger.error("❌ Database connection failed", error);
        throw error;
      }
    }
  }

  static async disconnect(): Promise<void> {
    if (PrismaClientSingleton.isConnected) {
      try {
        await PrismaClientSingleton.getInstance().$disconnect();
        await pool.end();
        PrismaClientSingleton.isConnected = false;
        logger.info("Database disconnected");
      } catch (error) {
        logger.error("Error disconnecting from database", error);
        throw error;
      }
    }
  }

  static async healthCheck(): Promise<boolean> {
    try {
      await PrismaClientSingleton.getInstance().$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error("Database health check failed", error);
      return false;
    }
  }
}

// Export singleton instance
export const prisma = PrismaClientSingleton.getInstance();

// Export connection methods
export const connectDatabase = PrismaClientSingleton.connect;
export const disconnectDatabase = PrismaClientSingleton.disconnect;
export const checkDatabaseHealth = PrismaClientSingleton.healthCheck;

// Handle graceful shutdown
process.on("beforeExit", async () => {
  await disconnectDatabase();
});

