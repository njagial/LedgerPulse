import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/Card";

describe("Card components", () => {
  it("renders Card with children", () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("renders Card with custom className", () => {
    render(<Card className="custom-card">Styled</Card>);
    const card = screen.getByText("Styled");
    expect(card.className).toContain("custom-card");
    expect(card.className).toContain("rounded-xl");
  });

  it("renders CardHeader", () => {
    render(
      <Card>
        <CardHeader>Header</CardHeader>
      </Card>
    );
    expect(screen.getByText("Header")).toBeInTheDocument();
  });

  it("renders CardTitle as h3", () => {
    render(
      <Card>
        <CardTitle>Title Text</CardTitle>
      </Card>
    );
    const title = screen.getByText("Title Text");
    expect(title.tagName).toBe("H3");
  });

  it("renders CardContent", () => {
    render(
      <Card>
        <CardContent>Content here</CardContent>
      </Card>
    );
    expect(screen.getByText("Content here")).toBeInTheDocument();
  });

  it("composes all card parts together", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>My Card</CardTitle>
        </CardHeader>
        <CardContent>Body content</CardContent>
      </Card>
    );
    expect(screen.getByText("My Card")).toBeInTheDocument();
    expect(screen.getByText("Body content")).toBeInTheDocument();
  });
});
