import { Card, CardHeader, CardTitle, CardContent } from "./Card";
import { Badge } from "./Badge";
import type { Transaction } from "@/types";
import { AlertTriangle } from "lucide-react";

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
  REVENUE: "bg-emerald-100 text-emerald-800",
  SOFTWARE_SAAS: "bg-indigo-100 text-indigo-800",
  MARKETING: "bg-amber-100 text-amber-800",
  LEGAL_ADMIN: "bg-violet-100 text-violet-800",
  HARDWARE: "bg-teal-100 text-teal-800",
  TAX: "bg-red-100 text-red-800",
  MISCELLANEOUS: "bg-gray-100 text-gray-800",
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
          <p className="text-sm text-muted-foreground text-center py-8">
            No transactions yet. Upload a receipt or send a webhook to get
            started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm truncate">
                    {tx.merchant}
                  </span>
                  {tx.isAnomaly && (
                    <Badge variant="destructive" className="gap-1">
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
                    variant="secondary"
                    className={CATEGORY_COLORS[tx.category]}
                  >
                    {CATEGORY_LABELS[tx.category] || tx.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {timeAgo(tx.createdAt)}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span
                  className={
                    tx.category === "REVENUE"
                      ? "text-emerald-600 font-semibold"
                      : "text-foreground font-semibold"
                  }
                >
                  {tx.category === "REVENUE" ? "+" : "-"}
                  {formatCurrency(tx.amount)}
                </span>
                <p className="text-xs text-muted-foreground">
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
