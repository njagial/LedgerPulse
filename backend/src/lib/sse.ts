import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

type SSEClient = {
  id: string;
  reply: FastifyReply;
};

const clients: Map<string, SSEClient> = new Map();

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

export function broadcastSSE(event: string, data: unknown): void {
  const payload = `data: ${JSON.stringify({ type: event, data })}\n\n`;
  for (const [, client] of clients) {
    client.reply.raw.write(payload);
  }
}
