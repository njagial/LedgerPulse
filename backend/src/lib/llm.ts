import OpenAI from "openai";
import { loadConfig } from "../config/index.js";

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!client) {
    const config = loadConfig();
    client = new OpenAI({ apiKey: config.openaiApiKey });
  }
  return client;
}

export interface ParsedTransaction {
  transactionDate: string;
  amount: number;
  currency: string;
  merchant: string;
  category:
    | "REVENUE"
    | "SOFTWARE_SAAS"
    | "MARKETING"
    | "LEGAL_ADMIN"
    | "HARDWARE"
    | "TAX"
    | "MISCELLANEOUS";
  categoryReason: string;
}

const SYSTEM_PROMPT = `You are a financial transaction parser. Given raw text from a receipt, SMS, webhook, or bank statement, extract structured transaction data.

You MUST return valid JSON matching this exact schema:
{
  "transactionDate": "YYYY-MM-DD",
  "amount": number,
  "currency": "USD",
  "merchant": "string",
  "category": "REVENUE" | "SOFTWARE_SAAS" | "MARKETING" | "LEGAL_ADMIN" | "HARDWARE" | "TAX" | "MISCELLANEOUS",
  "categoryReason": "short explanation of why this category was chosen"
}

Category definitions:
- REVENUE: Income, payments received, client invoices paid
- SOFTWARE_SAAS: Software subscriptions, cloud services, developer tools
- MARKETING: Advertising, promotions, social media ads, content marketing
- LEGAL_ADMIN: Legal fees, accounting, insurance, compliance, office supplies
- HARDWARE: Physical equipment, computers, peripherals, furniture
- TAX: Tax payments, filings, government fees
- MISCELLANEOUS: Anything that doesn't fit the above categories

Rules:
- If the amount is negative or indicates money going OUT, it's an expense (use the appropriate expense category)
- If the amount is positive or indicates money coming IN, classify as REVENUE
- If you cannot determine the currency, default to USD
- If you cannot parse a date, use today's date
- Be precise with amounts - include cents if present
- The categoryReason must be a concise 1-sentence explanation`;

export async function parseTransactionWithLLM(
  rawText: string
): Promise<ParsedTransaction> {
  const openai = getOpenAI();

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Parse this transaction data into structured JSON:\n\n${rawText}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0,
    max_tokens: 500,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("LLM returned empty response");
  }

  const parsed = JSON.parse(content) as ParsedTransaction;

  if (
    !parsed.transactionDate ||
    parsed.amount === undefined ||
    !parsed.merchant ||
    !parsed.category
  ) {
    throw new Error(`LLM returned incomplete data: ${content}`);
  }

  const validCategories = [
    "REVENUE",
    "SOFTWARE_SAAS",
    "MARKETING",
    "LEGAL_ADMIN",
    "HARDWARE",
    "TAX",
    "MISCELLANEOUS",
  ];
  if (!validCategories.includes(parsed.category)) {
    parsed.category = "MISCELLANEOUS";
  }

  return parsed;
}

export function mockOCRTextExtraction(_filePath: string): string {
  const mockTexts = [
    " payment to Stripe Inc. on 2024-01-15 for $49.99 USD - Monthly platform subscription",
    "TRANSFER from Acme Corp - Invoice #1042 - Payment received $2,500.00 USD on 2024-01-14",
    "Purchase at Best Buy Store #1032 - Laptop MacBook Pro 16in - $2,499.00 USD - 2024-01-13",
    "AWS Amazon Web Services charge - $187.42 USD - 2024-01-12 - Cloud hosting services",
    "Google Workspace Business - $12.00 USD per user/month - 2024-01-11",
    "Payment from ClientXYZ - Consulting services - $5,000.00 USD - 2024-01-10",
    "WeWork Coworking - Monthly desk rental - $450.00 USD - 2024-01-09",
    "IRS Tax Payment - Quarterly estimated tax - $1,200.00 USD - 2024-01-08",
  ];
  return mockTexts[Math.floor(Math.random() * mockTexts.length)];
}
