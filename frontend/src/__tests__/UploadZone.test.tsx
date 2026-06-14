import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { UploadZone } from "@/components/UploadZone";

vi.mock("@/lib/api", () => ({
  uploadFile: vi.fn(),
}));

import { uploadFile } from "@/lib/api";
const mockUploadFile = vi.mocked(uploadFile);

beforeEach(() => {
  mockUploadFile.mockReset();
});

describe("UploadZone", () => {
  it("renders upload zone with instructions", () => {
    render(<UploadZone />);
    expect(screen.getByText("Upload Statements")).toBeInTheDocument();
    expect(screen.getByText(/Drag & drop receipts/)).toBeInTheDocument();
    expect(screen.getByText(/PDF, PNG, JPEG, TXT, CSV/)).toBeInTheDocument();
  });

  it("renders hidden file input", () => {
    const { container } = render(<UploadZone />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.type).toBe("file");
    expect(input.accept).toBe(".pdf,.png,.jpg,.jpeg,.txt,.csv");
    expect(input).toHaveClass("hidden");
  });

  it("shows upload list after successful file selection", async () => {
    mockUploadFile.mockResolvedValueOnce({ accepted: true, payloadId: "p1", jobId: "j1" });

    const { container } = render(<UploadZone />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["test content"], "receipt.pdf", { type: "application/pdf" });

    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByText("receipt.pdf")).toBeInTheDocument();
    expect(await screen.findByText("Parsed")).toBeInTheDocument();
    expect(mockUploadFile).toHaveBeenCalledWith(file);
  });

  it("shows error state on upload failure", async () => {
    mockUploadFile.mockRejectedValueOnce(new Error("Upload failed"));

    const { container } = render(<UploadZone />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["test"], "bad.exe", { type: "application/octet-stream" });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("Failed")).toBeInTheDocument();
    });
    expect(mockUploadFile).toHaveBeenCalled();
  });
});
