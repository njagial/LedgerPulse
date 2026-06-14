import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    const result = cn("px-2", "py-1");
    expect(result).toBe("px-2 py-1");
  });

  it("resolves tailwind conflicts", () => {
    const result = cn("px-2", "px-4");
    expect(result).toBe("px-4");
  });

  it("handles conditional classes", () => {
    const result = cn("base", false && "hidden", true && "active");
    expect(result).toContain("base");
    expect(result).toContain("active");
    expect(result).not.toContain("hidden");
  });

  it("handles empty input", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("handles undefined and null", () => {
    const result = cn("base", undefined, null);
    expect(result).toBe("base");
  });
});
