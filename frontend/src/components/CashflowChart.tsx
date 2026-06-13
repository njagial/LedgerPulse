import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "./Card";
import type { CashflowPoint } from "@/types";

interface CashflowChartProps {
  historical: CashflowPoint[];
  forecast: CashflowPoint[];
}

export function CashflowChart({ historical, forecast }: CashflowChartProps) {
  const allData = [
    ...historical.map((d) => ({ ...d, type: "historical" as const })),
    ...forecast.map((d) => ({ ...d, type: "forecast" as const })),
  ];

  const today = new Date().toISOString().split("T")[0];

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-base">
          Cashflow: Historical vs Projected
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={allData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tickFormatter={(val: string) => {
                  const d = new Date(val);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(val: number) =>
                  `$${(val / 1000).toFixed(1)}k`
                }
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(value: number) => [
                  `$${value.toLocaleString()}`,
                  undefined,
                ]}
                labelFormatter={(label: string) => {
                  const d = new Date(label);
                  return d.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                }}
              />
              <Legend />
              <ReferenceLine
                x={today}
                stroke="#94a3b8"
                strokeDasharray="3 3"
                label={{ value: "Today", position: "top", fontSize: 11 }}
              />
              <ReferenceLine
                y={0}
                stroke="#ef4444"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                name="Balance"
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#16a34a"
                strokeWidth={1.5}
                dot={false}
                name="Income"
                strokeDasharray="5 5"
                opacity={0.6}
              />
              <Line
                type="monotone"
                dataKey="expense"
                stroke="#dc2626"
                strokeWidth={1.5}
                dot={false}
                name="Expense"
                strokeDasharray="5 5"
                opacity={0.6}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
