const API_BASE = "";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || error.error || "Request failed");
  }

  return res.json();
}

export async function fetchCashflow(
  days = 30,
  forecastDays = 30
): Promise<import("../types").CashflowData> {
  return request(
    `/api/v1/analytics/cashflow?days=${days}&forecastDays=${forecastDays}`
  );
}

export async function fetchCategories(): Promise<{
  categories: import("../types").CategoryBreakdown[];
}> {
  return request("/api/v1/analytics/categories");
}

export async function fetchSummary(): Promise<{
  totalTransactions: number;
  recentTransactions: number;
  anomalies: number;
}> {
  return request("/api/v1/analytics/summary");
}

export async function uploadFile(
  file: File
): Promise<{ accepted: boolean; payloadId: string; jobId: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/v1/ingest/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_WEBHOOK_SECRET || "whsec_your_secret_here"}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || error.error || "Upload failed");
  }

  return res.json();
}

export function connectSSE(
  onEvent: (event: import("../types").SSEEvent) => void
): EventSource {
  const es = new EventSource("/api/v1/events");

  es.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      onEvent(data);
    } catch {
      // ignore parse errors
    }
  };

  es.onerror = () => {
    console.warn("SSE connection error, will reconnect...");
  };

  return es;
}
