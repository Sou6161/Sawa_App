/**
 * Database Seeding Script
 * 
 * This script seeds the database with initial data.
 * Run with: npm run db:seed
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Example: Create a test user
  // const user = await prisma.user.create({
  //   data: {
  //     email: "test@example.com",
  //     name: "Test User",
  //   },
  // });

  // console.log("✅ Created user:", user);

  console.log("✅ Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

