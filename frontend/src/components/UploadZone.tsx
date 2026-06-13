import { useState, useRef, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./Card";
import { Badge } from "./Badge";
import { uploadFile } from "@/lib/api";
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from "lucide-react";

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface UploadEntry {
  id: string;
  name: string;
  status: UploadStatus;
  error?: string;
}

export function UploadZone() {
  const [uploads, setUploads] = useState<UploadEntry[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const entry: UploadEntry = { id, name: file.name, status: "uploading" };

      setUploads((prev) => [entry, ...prev]);

      try {
        await uploadFile(file);
        setUploads((prev) =>
          prev.map((u) => (u.id === id ? { ...u, status: "success" } : u))
        );
      } catch (err) {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === id
              ? { ...u, status: "error", error: (err as Error).message }
              : u
          )
        );
      }
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Upload Statements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors
            ${
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }
          `}
        >
          <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Drag & drop receipts, statements, or images
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            PDF, PNG, JPEG, TXT, CSV up to 10MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.txt,.csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {uploads.length > 0 && (
          <div className="space-y-2">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className="flex items-center gap-3 p-2 rounded-md bg-muted/30 text-sm"
              >
                {upload.status === "uploading" && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                )}
                {upload.status === "success" && (
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                )}
                {upload.status === "error" && (
                  <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                )}
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="flex-1 truncate">{upload.name}</span>
                <Badge
                  variant={
                    upload.status === "success"
                      ? "default"
                      : upload.status === "error"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {upload.status === "uploading"
                    ? "Processing..."
                    : upload.status === "success"
                      ? "Parsed"
                      : "Failed"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
