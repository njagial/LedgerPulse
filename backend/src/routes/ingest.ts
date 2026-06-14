import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { getPrisma } from "../lib/prisma.js";
import { getTransactionQueue } from "../lib/queue.js";
import { loadConfig } from "../config/index.js";

const webhookSchema = z.record(z.unknown());

export async function ingestRoutes(fastify: FastifyInstance): Promise<void> {
  const config = loadConfig();

  fastify.post("/api/v1/ingest/webhook", async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;
    if (authHeader !== `Bearer ${config.webhookSecret}`) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    let body: Record<string, unknown>;
    try {
      body = webhookSchema.parse(request.body);
    } catch (e: any) {
      return reply.code(400).send({ error: "Validation Error", message: e.message });
    }
    const prisma = getPrisma();

    const rawPayload = await prisma.rawPayload.create({
      data: {
        source: "WEBHOOK",
        content: body,
      },
    });

    const queue = getTransactionQueue();
    const rawText = formatWebhookPayload(body);
    const job = await queue.add("process-transaction", {
      rawPayloadId: rawPayload.id,
      source: "WEBHOOK",
      content: body,
      rawText,
    });

    await prisma.rawPayload.update({
      where: { id: rawPayload.id },
      data: { jobId: job.id },
    });

    return reply.code(202).send({
      accepted: true,
      payloadId: rawPayload.id,
      jobId: job.id,
    });
  });

  fastify.post("/api/v1/ingest/upload", async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;
    if (authHeader !== `Bearer ${config.webhookSecret}`) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    const data = await request.file();
    if (!data) {
      return reply.code(400).send({ error: "No file uploaded" });
    }

    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "text/plain",
      "text/csv",
    ];
    if (!allowedTypes.includes(data.mimetype)) {
      return reply.code(400).send({
        error: "Unsupported file type. Allowed: PDF, PNG, JPEG, TXT, CSV",
      });
    }

    const fs = await import("fs/promises");
    const path = await import("path");
    const { randomUUID } = await import("crypto");

    const ext = path.extname(data.filename);
    const fileName = `${randomUUID()}${ext}`;
    const filePath = path.join(config.uploadDir, fileName);

    const fileBuffer = await data.toBuffer();
    await fs.writeFile(filePath, fileBuffer);

    const prisma = getPrisma();
    const rawPayload = await prisma.rawPayload.create({
      data: {
        source: "UPLOAD",
        content: { originalName: data.filename, mimeType: data.mimetype },
        fileName: data.filename,
        filePath: fileName,
      },
    });

    const queue = getTransactionQueue();
    const job = await queue.add("process-transaction", {
      rawPayloadId: rawPayload.id,
      source: "UPLOAD",
      filePath: fileName,
    });

    await prisma.rawPayload.update({
      where: { id: rawPayload.id },
      data: { jobId: job.id },
    });

    return reply.code(202).send({
      accepted: true,
      payloadId: rawPayload.id,
      jobId: job.id,
      fileName: data.filename,
    });
  });
}

function formatWebhookPayload(payload: Record<string, unknown>): string {
  if (payload.text && typeof payload.text === "string") {
    return payload.text;
  }
  if (payload.body && typeof payload.body === "string") {
    return payload.body;
  }
  if (payload.message && typeof payload.message === "string") {
    return payload.message;
  }
  return JSON.stringify(payload, null, 2);
}
