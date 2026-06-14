import { useState, useRef, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./Card";
import { Badge } from "./Badge";
import { uploadFile, sendWebhook } from "@/lib/api";
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  Send,
  Type,
  Code,
  ArrowRight,
} from "lucide-react";

type Tab = "quick" | "upload" | "webhook";
type UploadStatus = "idle" | "uploading" | "success" | "error";
type SendStatus = "idle" | "sending" | "success" | "error";

interface UploadEntry {
  id: string;
  name: string;
  status: UploadStatus;
  error?: string;
}

const PRESETS = [
  {
    name: "Payment Receipt",
    payload: {
      store_name: "Coffee Shop",
      items: [
        { name: "Latte", quantity: 2, price: 5.5 },
        { name: "Muffin", quantity: 1, price: 3.25 },
      ],
      total: 14.25,
      payment_method: "Credit Card",
      timestamp: new Date().toISOString(),
    },
  },
  {
    name: "Bank SMS",
    payload: {
      text: "Your account ending in 1234 was charged $45.00 at AMAZON.COM on 2026-06-14. Available balance: $1,234.56",
    },
  },
  {
    name: "Invoice Payment",
    payload: {
      text: "Received $2,500 payment from Acme Corp for Invoice #1042 - Web development services",
    },
  },
];

export function InputSection() {
  const [activeTab, setActiveTab] = useState<Tab>("quick");
  const [uploads, setUploads] = useState<UploadEntry[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [quickText, setQuickText] = useState("");
  const [quickStatus, setQuickStatus] = useState<SendStatus>("idle");

  const [selectedPreset, setSelectedPreset] = useState(0);
  const [customPayload, setCustomPayload] = useState(
    JSON.stringify(PRESETS[0].payload, null, 2)
  );
  const [webhookStatus, setWebhookStatus] = useState<SendStatus>("idle");

  const handleQuickSubmit = async () => {
    if (!quickText.trim()) return;
    setQuickStatus("sending");
    try {
      await sendWebhook({ text: quickText.trim() });
      setQuickStatus("success");
      setQuickText("");
      setTimeout(() => setQuickStatus("idle"), 2000);
    } catch {
      setQuickStatus("error");
      setTimeout(() => setQuickStatus("idle"), 3000);
    }
  };

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
            u.id === id ? { ...u, status: "error", error: (err as Error).message } : u
          )
        );
      }
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleWebhookSend = async () => {
    setWebhookStatus("sending");
    try {
      const payload = JSON.parse(customPayload);
      await sendWebhook(payload);
      setWebhookStatus("success");
      setTimeout(() => setWebhookStatus("idle"), 2000);
    } catch {
      setWebhookStatus("error");
      setTimeout(() => setWebhookStatus("idle"), 3000);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "quick", label: "Quick Entry", icon: Type },
    { id: "upload", label: "Upload File", icon: Upload },
    { id: "webhook", label: "Webhook", icon: Code },
  ];

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Add Transaction</CardTitle>
          <div className="flex rounded-lg bg-muted p-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200
                  ${
                    activeTab === tab.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activeTab === "quick" && (
          <div className="space-y-3 animate-fade-in">
            <p className="text-xs text-muted-foreground">
              Describe your transaction in plain text
            </p>
            <div className="relative">
              <textarea
                value={quickText}
                onChange={(e) => setQuickText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleQuickSubmit();
                  }
                }}
                placeholder="e.g. Paid $49.99 to Stripe for monthly subscription"
                className="w-full h-24 p-3 pr-12 text-sm rounded-lg border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <button
                onClick={handleQuickSubmit}
                disabled={!quickText.trim() || quickStatus === "sending"}
                className="absolute right-2 bottom-2 p-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {quickStatus === "sending" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-2">
              {quickStatus === "success" && (
                <Badge variant="default" className="gap-1 bg-success text-success-foreground animate-scale-in">
                  <CheckCircle className="h-3 w-3" /> Sent for processing
                </Badge>
              )}
              {quickStatus === "error" && (
                <Badge variant="destructive" className="gap-1 animate-scale-in">
                  <XCircle className="h-3 w-3" /> Failed to send
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {["Coffee $5.50", "Uber ride $23", "Client payment $2500"].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setQuickText(suggestion)}
                  className="px-2.5 py-1 text-xs rounded-full border bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === "upload" && (
          <div className="space-y-3 animate-fade-in">
            <div
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
                ${isDragOver
                  ? "border-primary bg-primary/5 scale-[1.02]"
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
                }
              `}
            >
              <Upload className={`h-8 w-8 mx-auto mb-2 transition-colors ${isDragOver ? "text-primary" : "text-muted-foreground"}`} />
              <p className="text-sm font-medium">
                {isDragOver ? "Drop files here" : "Drag & drop or click to upload"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
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
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {uploads.map((upload) => (
                  <div
                    key={upload.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 text-sm animate-slide-up"
                  >
                    {upload.status === "uploading" && (
                      <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                    )}
                    {upload.status === "success" && (
                      <CheckCircle className="h-4 w-4 text-success shrink-0" />
                    )}
                    {upload.status === "error" && (
                      <XCircle className="h-4 w-4 text-destructive shrink-0" />
                    )}
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="flex-1 truncate text-xs">{upload.name}</span>
                    <Badge
                      variant={
                        upload.status === "success" ? "default" : upload.status === "error" ? "destructive" : "secondary"
                      }
                      className="text-[10px]"
                    >
                      {upload.status === "uploading" ? "Processing" : upload.status === "success" ? "Parsed" : "Failed"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "webhook" && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex gap-1.5 flex-wrap">
              {PRESETS.map((preset, i) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    setSelectedPreset(i);
                    setCustomPayload(JSON.stringify(preset.payload, null, 2));
                  }}
                  className={`px-2.5 py-1 text-xs rounded-md transition-all ${
                    selectedPreset === i
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>

            <textarea
              value={customPayload}
              onChange={(e) => setCustomPayload(e.target.value)}
              className="w-full h-32 p-3 text-xs font-mono rounded-lg border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="Enter JSON payload..."
            />

            <div className="flex items-center gap-2">
              <button
                onClick={handleWebhookSend}
                disabled={webhookStatus === "sending"}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
              >
                {webhookStatus === "sending" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send
              </button>
              {webhookStatus === "success" && (
                <Badge variant="default" className="gap-1 bg-success text-success-foreground animate-scale-in">
                  <CheckCircle className="h-3 w-3" /> Sent
                </Badge>
              )}
              {webhookStatus === "error" && (
                <Badge variant="destructive" className="gap-1 animate-scale-in">
                  <XCircle className="h-3 w-3" /> Failed
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
