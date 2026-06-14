import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../config/index.js", () => ({
  loadConfig: () => ({
    port: 3001,
    host: "0.0.0.0",
    databaseUrl: "postgresql://test",
    redisUrl: "redis://localhost:6379",
    geminiApiKey: "test-gemini-key",
    webhookSecret: "whsec_test",
    uploadDir: "./uploads",
  }),
}));

const mockGenerateContent = vi.fn();

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: class MockGoogleGenerativeAI {
    getGenerativeModel() {
      return {
        generateContent: mockGenerateContent,
      };
    }
  },
}));

describe("llm", () => {
  beforeEach(() => {
    mockGenerateContent.mockReset();
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () =>
          JSON.stringify({
            transactionDate: "2024-01-15",
            amount: 49.99,
            currency: "USD",
            merchant: "Stripe Inc.",
            category: "SOFTWARE_SAAS",
            categoryReason: "Monthly platform subscription",
          }),
      },
    });
  });

  it("parses transaction with LLM", async () => {
    const { parseTransactionWithLLM } = await import("../lib/llm.js");
    const result = await parseTransactionWithLLM("Payment to Stripe for $49.99");

    expect(result).toEqual({
      transactionDate: "2024-01-15",
      amount: 49.99,
      currency: "USD",
      merchant: "Stripe Inc.",
      category: "SOFTWARE_SAAS",
      categoryReason: "Monthly platform subscription",
    });
  });

  it("validates category and defaults to MISCELLANEOUS", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () =>
          JSON.stringify({
            transactionDate: "2024-01-15",
            amount: 100,
            currency: "USD",
            merchant: "Unknown",
            category: "INVALID_CATEGORY",
            categoryReason: "test",
          }),
      },
    });

    const { parseTransactionWithLLM } = await import("../lib/llm.js");
    const result = await parseTransactionWithLLM("some text");
    expect(result.category).toBe("MISCELLANEOUS");
  });

  it("throws on empty LLM response", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => "",
      },
    });

    const { parseTransactionWithLLM } = await import("../lib/llm.js");
    await expect(parseTransactionWithLLM("text")).rejects.toThrow("LLM returned empty response");
  });

  it("throws on incomplete LLM data", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () =>
          JSON.stringify({ transactionDate: "2024-01-15" }),
      },
    });

    const { parseTransactionWithLLM } = await import("../lib/llm.js");
    await expect(parseTransactionWithLLM("text")).rejects.toThrow("incomplete data");
  });

  it("mockOCRTextExtraction returns a string", async () => {
    const { mockOCRTextExtraction } = await import("../lib/llm.js");
    const result = mockOCRTextExtraction("/some/file.pdf");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});
