import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "./Card";
import type { CategoryBreakdown } from "@/types";

interface CategoryChartProps {
  categories: CategoryBreakdown[];
}

const CATEGORY_COLORS: Record<string, string> = {
  SOFTWARE_SAAS: "#6366f1",
  MARKETING: "#f59e0b",
  LEGAL_ADMIN: "#8b5cf6",
  HARDWARE: "#14b8a6",
  TAX: "#ef4444",
  MISCELLANEOUS: "#6b7280",
};

const CATEGORY_LABELS: Record<string, string> = {
  SOFTWARE_SAAS: "Software/SaaS",
  MARKETING: "Marketing",
  LEGAL_ADMIN: "Legal/Admin",
  HARDWARE: "Hardware",
  TAX: "Tax",
  MISCELLANEOUS: "Miscellaneous",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(value);
}

export function CategoryChart({ categories }: CategoryChartProps) {
  const data = categories.map((c) => ({
    ...c,
    name: CATEGORY_LABELS[c.category] || c.category,
    color: CATEGORY_COLORS[c.category] || "#6b7280",
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Expenses by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="totalAmount"
                nameKey="name"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "Amount"]}
              />
              <Legend
                formatter={(value: string) => (
                  <span className="text-xs">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
