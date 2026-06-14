import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { getPrisma } from "../lib/prisma.js";
import { Decimal } from "@prisma/client/runtime/library";

const querySchema = z.object({
  days: z.coerce.number().min(1).max(365).default(30),
  forecastDays: z.coerce.number().min(1).max(90).default(30),
});

export async function analyticsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get("/api/v1/analytics/cashflow", async (request: FastifyRequest, reply: FastifyReply) => {
    let days: number, forecastDays: number;
    try {
      const parsed = querySchema.parse(request.query);
      days = parsed.days;
      forecastDays = parsed.forecastDays;
    } catch (e: any) {
      return reply.code(400).send({ error: "Validation Error", message: e.message });
    }
    const prisma = getPrisma();

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    const transactions = await prisma.transaction.findMany({
      where: {
        transactionDate: { gte: startDate },
      },
      orderBy: { transactionDate: "asc" },
    });

    const dailyMap: Record<string, { income: number; expense: number; balance: number }> = {};

    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split("T")[0];
      dailyMap[key] = { income: 0, expense: 0, balance: 0 };
    }

    for (const tx of transactions) {
      const key = tx.transactionDate.toISOString().split("T")[0];
      if (!dailyMap[key]) {
        dailyMap[key] = { income: 0, expense: 0, balance: 0 };
      }
      const amount = Number(tx.amount);
      if (tx.category === "REVENUE") {
        dailyMap[key].income += amount;
      } else {
        dailyMap[key].expense += amount;
      }
    }

    let runningBalance = 0;
    const historical = Object.entries(dailyMap).map(([date, data]) => {
      runningBalance += data.income - data.expense;
      return { date, ...data, balance: runningBalance };
    });

    const recentIncome = historical.slice(-7).reduce((s, d) => s + d.income, 0) / 7;
    const recentExpense = historical.slice(-7).reduce((s, d) => s + d.expense, 0) / 7;
    const dailyIncomeRate = recentIncome;
    const dailyExpenseRate = recentExpense;

    const forecast: Array<{
      date: string;
      income: number;
      expense: number;
      balance: number;
      isProjected: boolean;
      warningThreshold?: number;
    }> = [];

    let forecastBalance = runningBalance;
    const warnings: Array<{ date: string; balance: number }> = [];

    for (let i = 1; i <= forecastDays; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split("T")[0];

      forecastBalance += dailyIncomeRate - dailyExpenseRate;

      forecast.push({
        date: key,
        income: Math.round(dailyIncomeRate * 100) / 100,
        expense: Math.round(dailyExpenseRate * 100) / 100,
        balance: Math.round(forecastBalance * 100) / 100,
        isProjected: true,
      });

      if (forecastBalance < 0) {
        warnings.push({ date: key, balance: Math.round(forecastBalance * 100) / 100 });
      }
    }

    const monthlyRevenue = transactions
      .filter((t) => t.category === "REVENUE")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const monthlyBurn = transactions
      .filter((t) => t.category !== "REVENUE")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const currentBalance = runningBalance;
    const dailyBurnRate = dailyExpenseRate - dailyIncomeRate;
    const runway =
      dailyBurnRate > 0
        ? Math.floor(currentBalance / dailyBurnRate)
        : currentBalance >= 0
          ? 999
          : 0;

    return {
      historical,
      forecast,
      summary: {
        currentBalance: Math.round(currentBalance * 100) / 100,
        monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
        monthlyBurn: Math.round(monthlyBurn * 100) / 100,
        runway,
        dailyIncomeRate: Math.round(dailyIncomeRate * 100) / 100,
        dailyExpenseRate: Math.round(dailyExpenseRate * 100) / 100,
      },
      warnings,
    };
  });

  fastify.get("/api/v1/analytics/categories", async (_request: FastifyRequest, reply: FastifyReply) => {
    const prisma = getPrisma();

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const expenses = await prisma.transaction.groupBy({
      by: ["category"],
      where: {
        transactionDate: { gte: thirtyDaysAgo },
        category: { not: "REVENUE" },
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    const result = expenses.map((e) => ({
      category: e.category,
      totalAmount: Number(e._sum.amount ?? 0),
      transactionCount: e._count.id,
    }));

    result.sort((a, b) => b.totalAmount - a.totalAmount);

    return { categories: result };
  });

  fastify.get("/api/v1/analytics/summary", async (_request: FastifyRequest, reply: FastifyReply) => {
    const prisma = getPrisma();
    const now = new Date();

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalTransactions = await prisma.transaction.count();
    const recentTransactions = await prisma.transaction.count({
      where: { transactionDate: { gte: thirtyDaysAgo } },
    });

    const anomalies = await prisma.transaction.count({
      where: { isAnomaly: true },
    });

    return {
      totalTransactions,
      recentTransactions,
      anomalies,
    };
  });
}
