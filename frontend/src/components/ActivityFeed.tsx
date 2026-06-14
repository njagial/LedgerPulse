import { Card, CardHeader, CardTitle, CardContent } from "./Card";
import { Badge } from "./Badge";
import type { Transaction } from "@/types";
import { AlertTriangle, Activity } from "lucide-react";

interface ActivityFeedProps {
  transactions: Transaction[];
}

const CATEGORY_LABELS: Record<string, string> = {
  REVENUE: "Revenue",
  SOFTWARE_SAAS: "Software/SaaS",
  MARKETING: "Marketing",
  LEGAL_ADMIN: "Legal/Admin",
  HARDWARE: "Hardware",
  TAX: "Tax",
  MISCELLANEOUS: "Misc",
};

const CATEGORY_COLORS: Record<string, string> = {
  REVENUE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  SOFTWARE_SAAS: "bg-indigo-50 text-indigo-700 border-indigo-200",
  MARKETING: "bg-amber-50 text-amber-700 border-amber-200",
  LEGAL_ADMIN: "bg-violet-50 text-violet-700 border-violet-200",
  HARDWARE: "bg-teal-50 text-teal-700 border-teal-200",
  TAX: "bg-red-50 text-red-700 border-red-200",
  MISCELLANEOUS: "bg-gray-50 text-gray-700 border-gray-200",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function ActivityFeed({ transactions }: ActivityFeedProps) {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-3 rounded-full bg-muted mb-3">
              <Activity className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              No transactions yet
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
              Upload a receipt or use Quick Entry to get started
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Recent Activity</CardTitle>
          <Badge variant="secondary" className="text-[10px]">
            {transactions.length} transactions
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {transactions.map((tx, index) => (
            <div
              key={tx.id}
              className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-background hover:bg-muted/30 transition-all duration-200 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm truncate">
                    {tx.merchant}
                  </span>
                  {tx.isAnomaly && (
                    <Badge variant="destructive" className="gap-1 text-[10px]">
                      <AlertTriangle className="h-3 w-3" />
                      Anomaly
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {tx.categoryReason}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${CATEGORY_COLORS[tx.category]}`}
                  >
                    {CATEGORY_LABELS[tx.category] || tx.category}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {timeAgo(tx.createdAt)}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span
                  className={
                    tx.category === "REVENUE"
                      ? "text-success font-semibold"
                      : "text-foreground font-semibold"
                  }
                >
                  {tx.category === "REVENUE" ? "+" : "-"}
                  {formatCurrency(tx.amount)}
                </span>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(tx.transactionDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
