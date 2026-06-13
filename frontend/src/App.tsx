import { useState, useEffect, useCallback, useRef } from "react";
import { MetricCards } from "./components/MetricCards";
import { CashflowChart } from "./components/CashflowChart";
import { CategoryChart } from "./components/CategoryChart";
import { ActivityFeed } from "./components/ActivityFeed";
import { UploadZone } from "./components/UploadZone";
import { fetchCashflow, fetchCategories, connectSSE } from "./lib/api";
import type {
  CashflowData,
  CategoryBreakdown,
  Transaction,
  SSEEvent,
} from "./types";
import { Wallet, RefreshCw } from "lucide-react";

export default function App() {
  const [cashflow, setCashflow] = useState<CashflowData | null>(null);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const sseRef = useRef<EventSource | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [cf, cat] = await Promise.all([fetchCashflow(30, 30), fetchCategories()]);
      setCashflow(cf);
      setCategories(cat.categories);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const es = connectSSE((event: SSEEvent) => {
      if (event.type === "transaction:created" && event.data) {
        const tx = event.data as Transaction;
        setTransactions((prev) => [tx, ...prev].slice(0, 50));
        setLastUpdate(new Date());
        loadData();
      }
      if (event.type === "job:failed" && event.data) {
        console.error("Processing failed:", event.data);
      }
    });
    sseRef.current = es;
    return () => es.close();
  }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Loading LedgerPulse...
          </p>
        </div>
      </div>
    );
  }

  const summary = cashflow?.summary ?? {
    currentBalance: 0,
    monthlyRevenue: 0,
    monthlyBurn: 0,
    runway: 0,
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="h-6 w-6" />
            <h1 className="text-lg font-semibold tracking-tight">
              LedgerPulse
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <MetricCards
          currentBalance={summary.currentBalance}
          monthlyRevenue={summary.monthlyRevenue}
          monthlyBurn={summary.monthlyBurn}
          runway={summary.runway}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CashflowChart
              historical={cashflow?.historical ?? []}
              forecast={cashflow?.forecast ?? []}
            />
          </div>
          <div>
            <CategoryChart categories={categories} />
          </div>
        </div>

        {cashflow?.warnings && cashflow.warnings.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h3 className="text-sm font-semibold text-amber-800 mb-2">
              Cashflow Warnings
            </h3>
            <div className="space-y-1">
              {cashflow.warnings.slice(0, 5).map((w) => (
                <p key={w.date} className="text-xs text-amber-700">
                  Projected balance drops to{" "}
                  <strong>${w.balance.toLocaleString()}</strong> on{" "}
                  {new Date(w.date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActivityFeed transactions={transactions} />
          <UploadZone />
        </div>
      </main>
    </div>
  );
}
