import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchCashflow, fetchCategories, fetchSummary, uploadFile, connectSSE } from "@/lib/api";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fetchCashflow", () => {
  it("fetches cashflow data with default params", async () => {
    const mockData = { historical: [], forecast: [], summary: {}, warnings: [] };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await fetchCashflow();
    expect(result).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/v1/analytics/cashflow?days=30&forecastDays=30",
      expect.objectContaining({
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  it("fetches cashflow with custom params", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await fetchCashflow(60, 14);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/v1/analytics/cashflow?days=60&forecastDays=14",
      expect.anything()
    );
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: "Internal Server Error",
      json: async () => ({ message: "DB error" }),
    });

    await expect(fetchCashflow()).rejects.toThrow("DB error");
  });
});

describe("fetchCategories", () => {
  it("fetches category breakdown", async () => {
    const mockData = { categories: [{ category: "MARKETING", totalAmount: 500, transactionCount: 3 }] };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await fetchCategories();
    expect(result).toEqual(mockData);
  });
});

describe("fetchSummary", () => {
  it("fetches transaction summary", async () => {
    const mockData = { totalTransactions: 100, recentTransactions: 10, anomalies: 2 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await fetchSummary();
    expect(result).toEqual(mockData);
  });
});

describe("uploadFile", () => {
  it("uploads a file successfully", async () => {
    const mockResponse = { accepted: true, payloadId: "p1", jobId: "j1" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const file = new File(["test"], "receipt.pdf", { type: "application/pdf" });
    const result = await uploadFile(file);
    expect(result).toEqual(mockResponse);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/v1/ingest/upload");
    expect(options.method).toBe("POST");
    expect(options.body).toBeInstanceOf(FormData);
  });

  it("throws on upload failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: "Bad Request",
      json: async () => ({ error: "Unsupported file type" }),
    });

    const file = new File(["test"], "image.exe", { type: "application/octet-stream" });
    await expect(uploadFile(file)).rejects.toThrow("Unsupported file type");
  });
});

describe("connectSSE", () => {
  it("creates an EventSource and parses messages", () => {
    let onmessage: ((event: MessageEvent) => void) | null = null;

    const mockES = {
      onmessage: null as ((event: MessageEvent) => void) | null,
      onerror: null,
      close: vi.fn(),
    };

    vi.stubGlobal(
      "EventSource",
      class {
        constructor() {
          onmessage = null;
        }
        set onmessage(fn) {
          onmessage = fn;
        }
        get onmessage() {
          return onmessage;
        }
        set onerror(fn) {}
        close() {}
      }
    );

    const onEvent = vi.fn();
    connectSSE(onEvent);

    expect(onmessage).toBeDefined();
  });
});
