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
  accent,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  accent?: string;
}) {
  return (
    <Card className="card-hover overflow-hidden relative">
      {accent && (
        <div className={cn("absolute top-0 left-0 right-0 h-1", accent)} />
      )}
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="p-2 rounded-lg bg-muted/50">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {trendLabel && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <span
              className={cn(
                "inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                trend === "up" && "bg-success/10 text-success",
                trend === "down" && "bg-destructive/10 text-destructive",
                trend === "neutral" && "bg-muted text-muted-foreground"
              )}
            >
              {trend === "up" && "↑ "}
              {trend === "down" && "↓ "}
              {trendLabel}
            </span>
          </div>
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-fade-in">
      <MetricCard
        title="Current Balance"
        value={formatCurrency(currentBalance)}
        icon={DollarSign}
        trend={currentBalance >= 0 ? "up" : "down"}
        trendLabel={currentBalance >= 0 ? "Positive" : "Negative"}
        accent="bg-gradient-to-r from-primary to-primary/60"
      />
      <MetricCard
        title="Monthly Revenue"
        value={formatCurrency(monthlyRevenue)}
        icon={TrendingUp}
        trend="up"
        trendLabel="Last 30 days"
        accent="bg-gradient-to-r from-success to-success/60"
      />
      <MetricCard
        title="Monthly Burn Rate"
        value={formatCurrency(monthlyBurn)}
        icon={TrendingDown}
        trend="down"
        trendLabel="Last 30 days"
        accent="bg-gradient-to-r from-destructive to-destructive/60"
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
        accent={cn(
          runway >= 999 && "bg-gradient-to-r from-success to-success/60",
          runway > 60 && runway < 999 && "bg-gradient-to-r from-primary to-primary/60",
          runway > 30 && runway <= 60 && "bg-gradient-to-r from-warning to-warning/60",
          runway <= 30 && "bg-gradient-to-r from-destructive to-destructive/60"
        )}
      />
    </div>
  );
}
