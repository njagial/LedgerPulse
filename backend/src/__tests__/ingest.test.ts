import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Fastify from "fastify";

const mockPrisma = {
  rawPayload: {
    create: vi.fn().mockResolvedValue({ id: "payload-1", source: "WEBHOOK", content: {} }),
    update: vi.fn().mockResolvedValue({}),
  },
};

const mockQueue = {
  add: vi.fn().mockResolvedValue({ id: "job-1" }),
};

vi.mock("../lib/prisma.js", () => ({
  getPrisma: () => mockPrisma,
}));

vi.mock("../lib/queue.js", () => ({
  getTransactionQueue: () => mockQueue,
}));

vi.mock("../config/index.js", () => ({
  loadConfig: () => ({
    port: 3001,
    host: "0.0.0.0",
    databaseUrl: "postgresql://test",
    redisUrl: "redis://localhost:6379",
    geminiApiKey: "test-gemini-key",
    webhookSecret: "whsec_test_secret",
    uploadDir: "./uploads",
  }),
}));

describe("ingest routes", () => {
  let app: ReturnType<typeof Fastify>;

  beforeEach(async () => {
    vi.resetModules();
    mockPrisma.rawPayload.create.mockClear();
    mockPrisma.rawPayload.update.mockClear();
    mockQueue.add.mockClear();

    mockPrisma.rawPayload.create.mockResolvedValue({ id: "payload-1", source: "WEBHOOK", content: {} });
    mockPrisma.rawPayload.update.mockResolvedValue({});
    mockQueue.add.mockResolvedValue({ id: "job-1" });

    const { ingestRoutes } = await import("../routes/ingest.js");
    app = Fastify({ logger: false });
    await app.register(ingestRoutes);
  });

  afterEach(async () => {
    await app.close();
  });

  describe("POST /api/v1/ingest/webhook", () => {
    it("accepts valid webhook with auth", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/ingest/webhook",
        headers: {
          authorization: "Bearer whsec_test_secret",
          "content-type": "application/json",
        },
        payload: { text: "Payment of $100 received" },
      });

      expect(response.statusCode).toBe(202);
      const body = JSON.parse(response.payload);
      expect(body.accepted).toBe(true);
      expect(body.payloadId).toBe("payload-1");
      expect(body.jobId).toBe("job-1");
    });

    it("rejects webhook without auth", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/ingest/webhook",
        headers: {
          "content-type": "application/json",
        },
        payload: { text: "test" },
      });

      expect(response.statusCode).toBe(401);
    });

    it("rejects webhook with wrong auth", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/ingest/webhook",
        headers: {
          authorization: "Bearer wrong_secret",
          "content-type": "application/json",
        },
        payload: { text: "test" },
      });

      expect(response.statusCode).toBe(401);
    });

    it("queues a processing job", async () => {
      await app.inject({
        method: "POST",
        url: "/api/v1/ingest/webhook",
        headers: {
          authorization: "Bearer whsec_test_secret",
          "content-type": "application/json",
        },
        payload: { text: "Payment received" },
      });

      expect(mockQueue.add).toHaveBeenCalledWith(
        "process-transaction",
        expect.objectContaining({
          rawPayloadId: "payload-1",
          source: "WEBHOOK",
        })
      );
    });

    it("accepts payment receipt webhook", async () => {
      const receiptPayload = {
        store_name: "Coffee Shop",
        items: [
          { name: "Latte", quantity: 2, price: 5.5 },
          { name: "Muffin", quantity: 1, price: 3.25 },
        ],
        total: 14.25,
        payment_method: "Credit Card",
        timestamp: "2026-06-14T10:30:00Z",
      };

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/ingest/webhook",
        headers: {
          authorization: "Bearer whsec_test_secret",
          "content-type": "application/json",
        },
        payload: receiptPayload,
      });

      expect(response.statusCode).toBe(202);
      const body = JSON.parse(response.payload);
      expect(body.accepted).toBe(true);
      expect(mockQueue.add).toHaveBeenCalledWith(
        "process-transaction",
        expect.objectContaining({
          rawPayloadId: "payload-1",
          source: "WEBHOOK",
        })
      );
    });
  });

  describe("POST /api/v1/ingest/upload", () => {
    it("rejects upload without auth", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/ingest/upload",
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
