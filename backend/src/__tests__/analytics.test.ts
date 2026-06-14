import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Fastify from "fastify";

vi.mock("../lib/prisma.js", () => ({
  getPrisma: () => ({
    transaction: {
      findMany: vi.fn().mockResolvedValue([]),
      groupBy: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
  }),
}));

describe("analytics routes", () => {
  let app: ReturnType<typeof Fastify>;

  beforeEach(async () => {
    vi.resetModules();

    const { analyticsRoutes } = await import("../routes/analytics.js");
    app = Fastify({ logger: false });
    await app.register(analyticsRoutes);
  });

  afterEach(async () => {
    await app.close();
  });

  describe("GET /api/v1/analytics/cashflow", () => {
    it("returns cashflow data with default params", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/analytics/cashflow",
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body).toHaveProperty("historical");
      expect(body).toHaveProperty("forecast");
      expect(body).toHaveProperty("summary");
      expect(body).toHaveProperty("warnings");
      expect(Array.isArray(body.historical)).toBe(true);
      expect(Array.isArray(body.forecast)).toBe(true);
    });

    it("accepts custom query params", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/analytics/cashflow?days=7&forecastDays=14",
      });

      expect(response.statusCode).toBe(200);
    });

    it("returns 400 for invalid query params", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/analytics/cashflow?days=0",
      });

      expect(response.statusCode).toBe(400);
    });

    it("returns 400 for forecastDays exceeding max", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/analytics/cashflow?forecastDays=100",
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("GET /api/v1/analytics/categories", () => {
    it("returns categories data", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/analytics/categories",
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body).toHaveProperty("categories");
      expect(Array.isArray(body.categories)).toBe(true);
    });
  });

  describe("GET /api/v1/analytics/summary", () => {
    it("returns summary data", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/analytics/summary",
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body).toHaveProperty("totalTransactions");
      expect(body).toHaveProperty("recentTransactions");
      expect(body).toHaveProperty("anomalies");
    });
  });
});
