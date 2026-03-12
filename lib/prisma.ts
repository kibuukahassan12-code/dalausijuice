// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  engine: {
    type: "client",
    // Use the default Node.js adapter (required for engine "client")
    adapter: "node"
    // Optionally, if you have Prisma Data Platform: accelerateUrl: process.env.PRISMA_ACCELERATE_URL
  }
});