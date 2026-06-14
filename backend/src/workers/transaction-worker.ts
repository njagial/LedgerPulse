import { Worker, Job } from "bullmq";
import { getPrisma } from "../lib/prisma.js";
import { getRedisConnection } from "../lib/queue.js";
import { parseTransactionWithLLM, mockOCRTextExtraction } from "../lib/llm.js";
import { publishSSE, initPublisher } from "../lib/sse.js";
import type { TransactionJobData } from "../types/index.js";

function createWorker(): Worker {
  const connection = getRedisConnection();

  return new Worker(
    "transaction-processing",
    async (job: Job<TransactionJobData>) => {
      console.log(`[Worker] Processing job ${job.id} for payload ${job.data.rawPayloadId}`);

      const prisma = getPrisma();
      const { rawPayloadId, source, filePath, rawText } = job.data;

      await prisma.rawPayload.update({
        where: { id: rawPayloadId },
        data: { status: "PROCESSING" },
      });

      await publishSSE("job:started", { rawPayloadId, jobId: job.id });

      try {
        let textToParse: string;

        if (rawText) {
          textToParse = rawText;
        } else if (filePath) {
          textToParse = mockOCRTextExtraction(filePath);
        } else if (job.data.content) {
          textToParse = formatPayloadForLLM(job.data.content);
        } else {
          throw new Error("No text content available for processing");
        }

        const parsed = await parseTransactionWithLLM(textToParse);

        const txDate = new Date(parsed.transactionDate);
        if (isNaN(txDate.getTime())) {
          throw new Error(`Invalid transaction date: ${parsed.transactionDate}`);
        }

        const isAnomaly = await checkAnomaly(
          prisma,
          parsed.merchant,
          parsed.amount
        );

        const transaction = await prisma.transaction.create({
          data: {
            rawPayloadId,
            transactionDate: txDate,
            amount: parsed.amount,
            currency: parsed.currency || "USD",
            merchant: parsed.merchant,
            category: parsed.category,
            categoryReason: parsed.categoryReason,
            isAnomaly,
            anomalyReason: isAnomaly
              ? `Amount $${parsed.amount} exceeds 150% of historical average`
              : null,
          },
        });

        await prisma.rawPayload.update({
          where: { id: rawPayloadId },
          data: { status: "COMPLETED" },
        });

        await publishSSE("transaction:created", {
          id: transaction.id,
          merchant: transaction.merchant,
          amount: Number(transaction.amount),
          currency: transaction.currency,
          category: transaction.category,
          categoryReason: transaction.categoryReason,
          isAnomaly: transaction.isAnomaly,
          anomalyReason: transaction.anomalyReason,
          transactionDate: transaction.transactionDate.toISOString(),
          createdAt: transaction.createdAt.toISOString(),
        });

        console.log(`[Worker] Successfully processed job ${job.id}`);
        return { transactionId: transaction.id, isAnomaly };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        await prisma.rawPayload.update({
          where: { id: rawPayloadId },
          data: { status: "FAILED", error: errorMessage },
        });

        await publishSSE("job:failed", {
          rawPayloadId,
          error: errorMessage,
        });

        console.error(`[Worker] Job ${job.id} failed:`, error);
        throw error;
      }
    },
    {
      connection,
      concurrency: 1,
      limiter: {
        max: 1,
        duration: 60000,
      },
    }
  );
}

async function checkAnomaly(
  prisma: ReturnType<typeof getPrisma>,
  merchant: string,
  amount: number
): Promise<boolean> {
  const avg = await prisma.merchantAverage.findUnique({
    where: { merchant },
  });

  if (!avg) {
    await prisma.merchantAverage.create({
      data: {
        merchant,
        avgAmount: amount,
        transactionCount: 1,
      },
    });
    return false;
  }

  const avgNum = Number(avg.avgAmount);
  if (avgNum > 0 && amount > avgNum * 1.5) {
    return true;
  }

  const newCount = avg.transactionCount + 1;
  const newAvg = (avgNum * avg.transactionCount + amount) / newCount;
  await prisma.merchantAverage.update({
    where: { merchant },
    data: {
      avgAmount: newAvg,
      transactionCount: newCount,
    },
  });

  return false;
}

function formatPayloadForLLM(content: Record<string, unknown>): string {
  if (content.text && typeof content.text === "string") {
    return content.text;
  }
  return JSON.stringify(content, null, 2);
}

const worker = createWorker();

initPublisher();

worker.on("ready", () => {
  console.log("[Worker] Transaction processing worker is ready");
});

worker.on("failed", (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("[Worker] Worker error:", err);
});

process.on("SIGTERM", async () => {
  console.log("[Worker] Shutting down...");
  await worker.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("[Worker] Shutting down...");
  await worker.close();
  process.exit(0);
});
