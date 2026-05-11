import { useEffect, useState } from "react";
import { Loader2, KeyRound, RefreshCw, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  eventId: string;
}

export const ResultsApiKeyManager = ({ eventId }: Props) => {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const ingestUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/results-ingest`;

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_event_results_api_key", { _event_id: eventId });
    if (error) toast.error(error.message);
    else setApiKey((data as string) ?? null);
    setLoading(false);
  };

  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [eventId]);

  const generate = async () => {
    if (apiKey && !confirm("Згенерувати новий ключ? Старий перестане працювати.")) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("generate_event_results_api_key", { _event_id: eventId });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setApiKey(data as string);
    toast.success("Новий API-ключ згенеровано");
  };

  const copy = async (text: string, tag: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(tag);
    setTimeout(() => setCopied(null), 1500);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Завантаження…
      </div>
    );
  }

  const example = `curl -X POST '${ingestUrl}' \\
  -H 'Content-Type: application/json' \\
  -H 'x-api-key: ${apiKey ?? "<API_KEY>"}' \\
  -d '{
    "results": [
      { "bib": 123, "time_seconds": 2456, "finish_position": 12 },
      { "bib": 124, "chip_time_seconds": "00:42:18", "gun_time_seconds": "00:42:25" }
    ]
  }'`;

  return (
    <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
          <KeyRound className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-base font-bold">API для імпорту результатів</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Передайте ключ системі хронометражу — вона буде надсилати результати з прив'язкою по BIB.
          </p>
        </div>
      </div>

      {apiKey ? (
        <div className="space-y-1.5">
          <Label className="text-xs">API-ключ події</Label>
          <div className="flex gap-2">
            <Input value={apiKey} readOnly className="font-mono text-xs" />
            <Button type="button" variant="outline" size="icon" onClick={() => copy(apiKey, "key")}>
              {copied === "key" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button type="button" variant="outline" size="icon" onClick={generate} disabled={busy} title="Згенерувати новий">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" onClick={generate} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          Згенерувати API-ключ
        </Button>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs">Endpoint</Label>
        <div className="flex gap-2">
          <Input value={ingestUrl} readOnly className="font-mono text-xs" />
          <Button type="button" variant="outline" size="icon" onClick={() => copy(ingestUrl, "url")}>
            {copied === "url" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <details className="text-xs">
        <summary className="cursor-pointer font-semibold text-foreground">Приклад запиту (cURL)</summary>
        <div className="mt-2 relative">
          <pre className="overflow-x-auto rounded-lg bg-background border border-border p-3 text-[11px] leading-relaxed">{example}</pre>
          <Button
            type="button" variant="outline" size="sm"
            className="absolute top-2 right-2"
            onClick={() => copy(example, "curl")}
          >
            {copied === "curl" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
        <div className="mt-3 space-y-1 text-muted-foreground">
          <p><strong>Поля:</strong> <code>bib</code> (або <code>registration_id</code>), <code>time_seconds</code> / <code>chip_time_seconds</code> / <code>gun_time_seconds</code> (число секунд або <code>hh:mm:ss</code>), <code>finish_position</code>, <code>finished_at</code> (ISO), <code>distance_km</code>, <code>notes</code>.</p>
          <p>Результат шукається за BIB у межах події. Існуючий запис оновлюється (upsert по реєстрації).</p>
          <p>Ліміт: до 5000 рядків за один запит.</p>
        </div>
      </details>
    </div>
  );
};
