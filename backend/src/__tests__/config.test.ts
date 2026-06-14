import { describe, it, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("config", () => {
  it("loads config from environment variables", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost:5432/test");
    vi.stubEnv("GEMINI_API_KEY", "test-gemini-key");
    vi.stubEnv("WEBHOOK_SECRET", "whsec_test");
    vi.stubEnv("PORT", "4000");
    vi.stubEnv("HOST", "127.0.0.1");
    vi.stubEnv("REDIS_URL", "redis://localhost:6380");
    vi.stubEnv("UPLOAD_DIR", "./test-uploads");

    const { loadConfig } = await import("../config/index.js");
    const config = loadConfig();

    expect(config.databaseUrl).toBe("postgresql://test:test@localhost:5432/test");
    expect(config.geminiApiKey).toBe("test-gemini-key");
    expect(config.webhookSecret).toBe("whsec_test");
    expect(config.port).toBe(4000);
    expect(config.host).toBe("127.0.0.1");
    expect(config.redisUrl).toBe("redis://localhost:6380");
    expect(config.uploadDir).toBe("./test-uploads");
  });

  it("uses defaults for optional fields", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost:5432/test");
    vi.stubEnv("GEMINI_API_KEY", "test-gemini-key");
    vi.stubEnv("WEBHOOK_SECRET", "whsec_test");

    const { loadConfig } = await import("../config/index.js");
    const config = loadConfig();

    expect(config.port).toBe(3001);
    expect(config.host).toBe("0.0.0.0");
    expect(config.redisUrl).toBe("redis://localhost:6379");
    expect(config.uploadDir).toBe("./uploads");
  });

  it("throws on missing required fields", async () => {
    const { loadConfig } = await import("../config/index.js");
    expect(() => loadConfig()).toThrow();
  });
});
