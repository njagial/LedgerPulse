import { PrismaClient } from "@prisma/client";
import { loadConfig } from "../config/index.js";

let prisma: PrismaClient;

export function getPrisma(): PrismaClient {
  if (!prisma) {
    const config = loadConfig();
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: config.databaseUrl,
        },
      },
    });
  }
  return prisma;
}

export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
  }
}
