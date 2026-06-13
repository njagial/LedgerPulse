import { PrismaClient } from "@prisma/client";
import { getRedisConnection } from "../src/lib/queue.js";
import { mockOCRTextExtraction } from "../src/lib/llm.js";

const prisma = new PrismaClient();

async function seed() {
  console.log("[Seed] Starting seed...");

  await prisma.transaction.deleteMany();
  await prisma.rawPayload.deleteMany();
  await prisma.merchantAverage.deleteMany();

  const merchants = [
    { name: "Stripe Inc.", category: "SOFTWARE_SAAS", type: "expense" },
    { name: "Acme Corp", category: "REVENUE", type: "income" },
    { name: "AWS", category: "SOFTWARE_SAAS", type: "expense" },
    { name: "WeWork", category: "LEGAL_ADMIN", type: "expense" },
    { name: "Figma", category: "SOFTWARE_SAAS", type: "expense" },
    { name: "Google Ads", category: "MARKETING", type: "expense" },
    { name: "ClientXYZ", category: "REVENUE", type: "income" },
    { name: "IRS", category: "TAX", type: "expense" },
    { name: "Best Buy", category: "HARDWARE", type: "expense" },
    { name: "Notion", category: "SOFTWARE_SAAS", type: "expense" },
  ];

  const now = new Date();
  const transactions = [];

  for (let day = 29; day >= 0; day--) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);

    const numTx = Math.floor(Math.random() * 4) + 1;
    for (let i = 0; i < numTx; i++) {
      const merchant = merchants[Math.floor(Math.random() * merchants.length)];
      const amount =
        merchant.type === "income"
          ? Math.round((Math.random() * 5000 + 500) * 100) / 100
          : Math.round((Math.random() * 500 + 10) * 100) / 100;

      const rawPayload = await prisma.rawPayload.create({
        data: {
          source: "WEBHOOK",
          content: { mock: true },
          status: "COMPLETED",
        },
      });

      const tx = await prisma.transaction.create({
        data: {
          rawPayloadId: rawPayload.id,
          transactionDate: date,
          amount,
          currency: "USD",
          merchant: merchant.name,
          category: merchant.category as any,
          categoryReason: `Mock seed data - ${merchant.type} transaction`,
          isAnomaly: Math.random() < 0.05,
        },
      });

      transactions.push(tx);
    }
  }

  for (const merchant of merchants) {
    const txs = transactions.filter((t) => t.merchant === merchant.name);
    if (txs.length > 0) {
      const avg = txs.reduce((s, t) => s + Number(t.amount), 0) / txs.length;
      await prisma.merchantAverage.create({
        data: {
          merchant: merchant.name,
          avgAmount: avg,
          transactionCount: txs.length,
        },
      });
    }
  }

  console.log(`[Seed] Created ${transactions.length} transactions`);
  console.log("[Seed] Seeding complete!");
}

seed()
  .catch((e) => {
    console.error("[Seed] Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
