import Redis from "ioredis";
import { Queue } from "bullmq";
import { loadConfig } from "../config/index.js";

let connection: Redis | null = null;
let transactionQueue: Queue | null = null;

export function getRedisConnection(): Redis {
  if (!connection) {
    const config = loadConfig();
    connection = new Redis(config.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
  return connection;
}

export function getTransactionQueue(): Queue {
  if (!transactionQueue) {
    transactionQueue = new Queue("transaction-processing", {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    });
  }
  return transactionQueue;
}

export async function closeRedis(): Promise<void> {
  if (connection) {
    await connection.quit();
    connection = null;
    transactionQueue = null;
  }
}
