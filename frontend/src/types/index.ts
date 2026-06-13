export interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  currency: string;
  category: TransactionCategory;
  categoryReason: string;
  isAnomaly: boolean;
  anomalyReason: string | null;
  transactionDate: string;
  createdAt: string;
}

export type TransactionCategory =
  | "REVENUE"
  | "SOFTWARE_SAAS"
  | "MARKETING"
  | "LEGAL_ADMIN"
  | "HARDWARE"
  | "TAX"
  | "MISCELLANEOUS";

export interface CashflowData {
  historical: CashflowPoint[];
  forecast: CashflowPoint[];
  summary: CashflowSummary;
  warnings: CashflowWarning[];
}

export interface CashflowPoint {
  date: string;
  income: number;
  expense: number;
  balance: number;
  isProjected?: boolean;
}

export interface CashflowSummary {
  currentBalance: number;
  monthlyRevenue: number;
  monthlyBurn: number;
  runway: number;
  dailyIncomeRate: number;
  dailyExpenseRate: number;
}

export interface CashflowWarning {
  date: string;
  balance: number;
}

export interface CategoryBreakdown {
  category: TransactionCategory;
  totalAmount: number;
  transactionCount: number;
}

export interface SSEEvent {
  type: string;
  data?: unknown;
  clientId?: string;
}
