export interface TransactionJobData {
  rawPayloadId: string;
  source: "WEBHOOK" | "UPLOAD";
  content?: Record<string, unknown>;
  filePath?: string;
  rawText?: string;
}
