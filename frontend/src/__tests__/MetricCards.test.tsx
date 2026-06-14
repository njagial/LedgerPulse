import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MetricCards } from "@/components/MetricCards";

describe("MetricCards", () => {
  const defaultProps = {
    currentBalance: 50000,
    monthlyRevenue: 12000,
    monthlyBurn: 8000,
    runway: 45,
  };

  it("renders all four metric cards", () => {
    render(<MetricCards {...defaultProps} />);
    expect(screen.getByText("Current Balance")).toBeInTheDocument();
    expect(screen.getByText("Monthly Revenue")).toBeInTheDocument();
    expect(screen.getByText("Monthly Burn Rate")).toBeInTheDocument();
    expect(screen.getByText("Runway")).toBeInTheDocument();
  });

  it("formats currency values correctly", () => {
    render(<MetricCards {...defaultProps} />);
    expect(screen.getByText("$50,000")).toBeInTheDocument();
    expect(screen.getByText("$12,000")).toBeInTheDocument();
    expect(screen.getByText("$8,000")).toBeInTheDocument();
  });

  it("displays runway in days", () => {
    render(<MetricCards {...defaultProps} />);
    expect(screen.getByText("45 days")).toBeInTheDocument();
  });

  it("displays infinity for high runway", () => {
    render(<MetricCards {...defaultProps} runway={999} />);
    expect(screen.getByText("∞")).toBeInTheDocument();
  });

  it("shows positive trend for positive balance", () => {
    render(<MetricCards {...defaultProps} />);
    expect(screen.getByText(/Positive/)).toBeInTheDocument();
  });

  it("shows negative trend for negative balance", () => {
    render(<MetricCards {...defaultProps} currentBalance={-5000} />);
    expect(screen.getByText(/Negative/)).toBeInTheDocument();
  });

  it("shows critical label for low runway", () => {
    render(<MetricCards {...defaultProps} runway={15} />);
    expect(screen.getByText(/Critical/)).toBeInTheDocument();
  });

  it("shows healthy label for high runway", () => {
    render(<MetricCards {...defaultProps} runway={90} />);
    expect(screen.getByText(/Healthy/)).toBeInTheDocument();
  });

  it("shows caution label for medium runway", () => {
    render(<MetricCards {...defaultProps} runway={45} />);
    expect(screen.getByText(/Caution/)).toBeInTheDocument();
  });
});
