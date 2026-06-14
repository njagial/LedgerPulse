import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyMultipart from "@fastify/multipart";
import { loadConfig } from "./config/index.js";
import { getPrisma, disconnectPrisma } from "./lib/prisma.js";
import { closeRedis } from "./lib/queue.js";
import { ingestRoutes } from "./routes/ingest.js";
import { analyticsRoutes } from "./routes/analytics.js";
import { registerSSE, subscribeSSE, closeSSE } from "./lib/sse.js";

async function main() {
  const config = loadConfig();

  const fastify = Fastify({
    logger: {
      level: "info",
      transport: {
        target: "pino-pretty",
        options: { colorize: true },
      },
    },
  });

  await fastify.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  await fastify.register(fastifyMultipart, {
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  });

  registerSSE(fastify);

  await fastify.register(ingestRoutes);
  await fastify.register(analyticsRoutes);

  fastify.get("/api/v1/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  fastify.setErrorHandler((error, _request, reply) => {
    fastify.log.error(error);

    const isValidationError =
      error.validation ||
      error.name === "ZodError" ||
      (error.message && error.message.includes('"code":'));

    if (isValidationError) {
      return reply.code(400).send({
        error: "Validation Error",
        message: error.message,
      });
    }

    return reply.code(500).send({
      error: "Internal Server Error",
      message:
        process.env.NODE_ENV === "production"
          ? "Something went wrong"
          : error.message,
    });
  });

  try {
    const prisma = getPrisma();
    await prisma.$connect();
    console.log("[Server] Database connected");

    await fastify.listen({ port: config.port, host: config.host });
    console.log(`[Server] LedgerPulse API running on http://${config.host}:${config.port}`);

    subscribeSSE();
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }

  const shutdown = async () => {
    console.log("[Server] Shutting down...");
    await fastify.close();
    await disconnectPrisma();
    await closeSSE();
    await closeRedis();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main();
