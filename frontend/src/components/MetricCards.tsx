import { Card, CardHeader, CardTitle, CardContent } from "./Card";
import { cn } from "@/lib/utils";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
} from "lucide-react";

interface MetricCardsProps {
  currentBalance: number;
  monthlyRevenue: number;
  monthlyBurn: number;
  runway: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trendLabel && (
          <p
            className={cn(
              "text-xs mt-1",
              trend === "up" && "text-emerald-600",
              trend === "down" && "text-red-600",
              trend === "neutral" && "text-muted-foreground"
            )}
          >
            {trend === "up" && "↑ "}
            {trend === "down" && "↓ "}
            {trendLabel}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function MetricCards({
  currentBalance,
  monthlyRevenue,
  monthlyBurn,
  runway,
}: MetricCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Current Balance"
        value={formatCurrency(currentBalance)}
        icon={DollarSign}
        trend={currentBalance >= 0 ? "up" : "down"}
        trendLabel={currentBalance >= 0 ? "Positive" : "Negative"}
      />
      <MetricCard
        title="Monthly Revenue"
        value={formatCurrency(monthlyRevenue)}
        icon={TrendingUp}
        trend="up"
        trendLabel="Last 30 days"
      />
      <MetricCard
        title="Monthly Burn Rate"
        value={formatCurrency(monthlyBurn)}
        icon={TrendingDown}
        trend="down"
        trendLabel="Last 30 days"
      />
      <MetricCard
        title="Runway"
        value={runway >= 999 ? "∞" : `${runway} days`}
        icon={Clock}
        trend={runway > 60 ? "up" : runway > 30 ? "neutral" : "down"}
        trendLabel={
          runway >= 999
            ? "Profitable"
            : runway > 60
              ? "Healthy"
              : runway > 30
                ? "Caution"
                : "Critical"
        }
      />
    </div>
  );
}
