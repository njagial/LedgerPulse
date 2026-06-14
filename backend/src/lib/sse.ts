import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import Redis from "ioredis";
import { loadConfig } from "../config/index.js";

type SSEClient = {
  id: string;
  reply: FastifyReply;
};

const clients: Map<string, SSEClient> = new Map();
const SSE_CHANNEL = "ledgerpulse:sse";
let subscriber: Redis | null = null;
let publisher: Redis | null = null;

export function registerSSE(fastify: FastifyInstance): void {
  fastify.get("/api/v1/events", async (request: FastifyRequest, reply: FastifyReply) => {
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    const clientId = Math.random().toString(36).substring(2, 15);
    const client: SSEClient = { id: clientId, reply };
    clients.set(clientId, client);

    request.raw.on("close", () => {
      clients.delete(clientId);
    });

    reply.raw.write(`data: ${JSON.stringify({ type: "connected", clientId })}\n\n`);
  });
}

function getRedisOpts() {
  return { maxRetriesPerRequest: null, enableReadyCheck: false };
}

export function initPublisher(): void {
  if (publisher) return;

  const config = loadConfig();
  publisher = new Redis(config.redisUrl, getRedisOpts());

  publisher.on("error", (err) => {
    console.error("[SSE] Publisher Redis error:", err);
  });

  console.log("[SSE] Publisher initialized");
}

export function subscribeSSE(): void {
  if (subscriber) return;

  initPublisher();

  const config = loadConfig();
  subscriber = new Redis(config.redisUrl, getRedisOpts());

  subscriber.on("error", (err) => {
    console.error("[SSE] Subscriber Redis error:", err);
  });

  subscriber.subscribe(SSE_CHANNEL, (err) => {
    if (err) {
      console.error("[SSE] Failed to subscribe to Redis channel:", err);
    } else {
      console.log("[SSE] Subscribed to Redis SSE channel");
    }
  });

  subscriber.on("message", (_channel, message) => {
    try {
      const { event, data } = JSON.parse(message);
      broadcastLocal(event, data);
    } catch (err) {
      console.error("[SSE] Failed to parse Redis message:", err);
    }
  });
}

export async function publishSSE(event: string, data: unknown): Promise<void> {
  if (!publisher) {
    initPublisher();
  }

  try {
    await publisher!.publish(SSE_CHANNEL, JSON.stringify({ event, data }));
  } catch (err) {
    console.error("[SSE] Failed to publish event:", event, err);
  }
}

function broadcastLocal(event: string, data: unknown): void {
  const payload = `data: ${JSON.stringify({ type: event, data })}\n\n`;
  for (const [, client] of clients) {
    client.reply.raw.write(payload);
  }
}

export async function closeSSE(): Promise<void> {
  if (subscriber) {
    await subscriber.quit();
    subscriber = null;
  }
  if (publisher) {
    await publisher.quit();
    publisher = null;
  }
}
