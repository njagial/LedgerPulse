import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./Card";
import { Badge } from "./Badge";
import { sendWebhook } from "@/lib/api";
import { Send, CheckCircle, XCircle, Loader2 } from "lucide-react";

const PRESET_PAYLOADS = [
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
    name: "Simple Text",
    payload: {
      text: "Received $500 payment from client Acme Corp",
    },
  },
];

type Status = "idle" | "sending" | "success" | "error";

export function WebhookTest() {
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [customPayload, setCustomPayload] = useState(
    JSON.stringify(PRESET_PAYLOADS[0].payload, null, 2)
  );
  const [status, setStatus] = useState<Status>("idle");
  const [response, setResponse] = useState<string>("");

  const handlePresetChange = (index: number) => {
    setSelectedPreset(index);
    setCustomPayload(JSON.stringify(PRESET_PAYLOADS[index].payload, null, 2));
  };

  const handleSend = async () => {
    setStatus("sending");
    setResponse("");

    try {
      const payload = JSON.parse(customPayload);
      const result = await sendWebhook(payload);
      setStatus("success");
      setResponse(JSON.stringify(result, null, 2));
    } catch (err) {
      setStatus("error");
      setResponse((err as Error).message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Test Webhook</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          {PRESET_PAYLOADS.map((preset, i) => (
            <button
              key={preset.name}
              onClick={() => handlePresetChange(i)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                selectedPreset === i
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>

        <textarea
          value={customPayload}
          onChange={(e) => setCustomPayload(e.target.value)}
          className="w-full h-40 p-3 text-xs font-mono rounded-md border bg-muted/30 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="Enter JSON payload..."
        />

        <div className="flex items-center gap-3">
          <button
            onClick={handleSend}
            disabled={status === "sending"}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {status === "sending" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send Webhook
          </button>

          {status === "success" && (
            <Badge variant="default" className="gap-1">
              <CheckCircle className="h-3 w-3" /> Sent
            </Badge>
          )}
          {status === "error" && (
            <Badge variant="destructive" className="gap-1">
              <XCircle className="h-3 w-3" /> Failed
            </Badge>
          )}
        </div>

        {response && (
          <pre className="p-3 text-xs font-mono rounded-md bg-muted/30 overflow-auto max-h-32">
            {response}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}
