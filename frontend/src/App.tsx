import { useState, useEffect, useCallback, useRef } from "react";
import { MetricCards } from "./components/MetricCards";
import { CashflowChart } from "./components/CashflowChart";
import { CategoryChart } from "./components/CategoryChart";
import { ActivityFeed } from "./components/ActivityFeed";
import { InputSection } from "./components/InputSection";
import { fetchCashflow, fetchCategories, connectSSE } from "./lib/api";
import type {
  CashflowData,
  CategoryBreakdown,
  Transaction,
  SSEEvent,
} from "./types";
import { Wallet, RefreshCw, Zap } from "lucide-react";

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
      <div className="min-h-screen flex items-center justify-center gradient-mesh">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <div className="relative p-4 rounded-full bg-primary/10">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Loading LedgerPulse</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Setting up your financial dashboard...
            </p>
          </div>
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
    <div className="min-h-screen gradient-mesh">
      <header className="sticky top-0 z-50 glass border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-lg blur-md" />
              <div className="relative p-2 rounded-lg gradient-primary">
                <Wallet className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                LedgerPulse
              </h1>
              <p className="text-[10px] text-muted-foreground -mt-0.5">
                Financial Intelligence
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">
                Real-time
              </span>
              <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Last updated</p>
              <p className="text-xs font-medium">{lastUpdate.toLocaleTimeString()}</p>
            </div>
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
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <svg className="h-5 w-5 text-warning" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-warning">
                  Cashflow Warnings
                </h3>
                <div className="mt-2 space-y-1.5">
                  {cashflow.warnings.slice(0, 3).map((w) => (
                    <p key={w.date} className="text-xs text-muted-foreground">
                      Projected balance drops to{" "}
                      <strong className="text-foreground">
                        ${w.balance.toLocaleString()}
                      </strong>{" "}
                      on{" "}
                      {new Date(w.date).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActivityFeed transactions={transactions} />
          <InputSection />
        </div>
      </main>
    </div>
  );
}
