import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ActivityFeed } from "@/components/ActivityFeed";
import type { Transaction } from "@/types";

const mockTransaction: Transaction = {
  id: "tx-1",
  merchant: "Stripe Inc.",
  amount: 49.99,
  currency: "USD",
  category: "SOFTWARE_SAAS",
  categoryReason: "Monthly platform subscription",
  isAnomaly: false,
  anomalyReason: null,
  transactionDate: "2024-01-15T00:00:00Z",
  createdAt: "2024-01-15T12:00:00Z",
};

describe("ActivityFeed", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T13:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders empty state when no transactions", () => {
    render(<ActivityFeed transactions={[]} />);
    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
    expect(screen.getByText(/No transactions yet/)).toBeInTheDocument();
  });

  it("renders transaction merchant name", () => {
    render(<ActivityFeed transactions={[mockTransaction]} />);
    expect(screen.getByText("Stripe Inc.")).toBeInTheDocument();
  });

  it("renders category label", () => {
    render(<ActivityFeed transactions={[mockTransaction]} />);
    expect(screen.getByText("Software/SaaS")).toBeInTheDocument();
  });

  it("renders formatted currency amount", () => {
    render(<ActivityFeed transactions={[mockTransaction]} />);
    expect(screen.getByText("-$49.99")).toBeInTheDocument();
  });

  it("renders positive amount for revenue", () => {
    const revenueTx = { ...mockTransaction, category: "REVENUE" as const, amount: 5000 };
    render(<ActivityFeed transactions={[revenueTx]} />);
    expect(screen.getByText("+$5,000.00")).toBeInTheDocument();
  });

  it("renders anomaly badge when isAnomaly is true", () => {
    const anomalyTx = { ...mockTransaction, isAnomaly: true, anomalyReason: "Unusual amount" };
    render(<ActivityFeed transactions={[anomalyTx]} />);
    expect(screen.getByText("Anomaly")).toBeInTheDocument();
  });

  it("does not render anomaly badge when isAnomaly is false", () => {
    render(<ActivityFeed transactions={[mockTransaction]} />);
    expect(screen.queryByText("Anomaly")).not.toBeInTheDocument();
  });

  it("renders category reason", () => {
    render(<ActivityFeed transactions={[mockTransaction]} />);
    expect(screen.getByText("Monthly platform subscription")).toBeInTheDocument();
  });

  it("renders relative time", () => {
    render(<ActivityFeed transactions={[mockTransaction]} />);
    expect(screen.getByText("1h ago")).toBeInTheDocument();
  });

  it("renders multiple transactions", () => {
    const tx2: Transaction = { ...mockTransaction, id: "tx-2", merchant: "AWS" };
    render(<ActivityFeed transactions={[mockTransaction, tx2]} />);
    expect(screen.getByText("Stripe Inc.")).toBeInTheDocument();
    expect(screen.getByText("AWS")).toBeInTheDocument();
  });
});
