import { useState } from "react";
import { Upload, Loader2, FileSpreadsheet, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  eventId: string;
}

interface ParsedRow {
  bib?: number;
  time_seconds?: number;
  chip_time_seconds?: number;
  gun_time_seconds?: number;
  finish_position?: number;
  notes?: string;
}

const parseTime = (v: string): number | undefined => {
  const s = v.trim();
  if (!s) return undefined;
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  const parts = s.split(":").map((p) => parseFloat(p));
  if (parts.some(Number.isNaN)) return undefined;
  if (parts.length === 3) return Math.round(parts[0] * 3600 + parts[1] * 60 + parts[2]);
  if (parts.length === 2) return Math.round(parts[0] * 60 + parts[1]);
  return undefined;
};

const parseCsv = (text: string): { rows: ParsedRow[]; warnings: string[] } => {
  const warnings: string[] = [];
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { rows: [], warnings: ["Файл порожній"] };

  const sep = lines[0].includes(";") && !lines[0].includes(",") ? ";" : ",";
  const header = lines[0].split(sep).map((h) => h.trim().toLowerCase());
  const idx = (names: string[]) => header.findIndex((h) => names.includes(h));
  const iBib = idx(["bib", "номер", "стартовий номер", "nr"]);
  const iTime = idx(["time", "час", "result", "time_seconds"]);
  const iChip = idx(["chip", "chip_time", "chip_time_seconds"]);
  const iGun = idx(["gun", "gun_time", "gun_time_seconds"]);
  const iPos = idx(["position", "place", "місце", "finish_position"]);
  const iNotes = idx(["notes", "коментар", "comment"]);

  if (iBib < 0) warnings.push("Не знайдено колонки 'bib'");
  if (iTime < 0 && iChip < 0 && iGun < 0) warnings.push("Не знайдено колонки часу (time/chip/gun)");

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map((c) => c.trim());
    const bibStr = iBib >= 0 ? cols[iBib] : "";
    const bib = bibStr ? parseInt(bibStr, 10) : undefined;
    const time = iTime >= 0 ? parseTime(cols[iTime] ?? "") : undefined;
    const chip = iChip >= 0 ? parseTime(cols[iChip] ?? "") : undefined;
    const gun = iGun >= 0 ? parseTime(cols[iGun] ?? "") : undefined;
    if (!bib || (!time && !chip && !gun)) continue;
    rows.push({
      bib,
      time_seconds: time,
      chip_time_seconds: chip,
      gun_time_seconds: gun,
      finish_position: iPos >= 0 && cols[iPos] ? parseInt(cols[iPos], 10) || undefined : undefined,
      notes: iNotes >= 0 ? cols[iNotes] || undefined : undefined,
    });
  }
  return { rows, warnings };
};

export const ResultsCsvImport = ({ eventId }: Props) => {
  const [open, setOpen] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [result, setResult] = useState<{ upserted: number; received: number; errors: any[] } | null>(null);

  const onFile = async (file: File) => {
    setParsing(true);
    setResult(null);
    try {
      const text = await file.text();
      const { rows: r, warnings: w } = parseCsv(text);
      setRows(r);
      setWarnings(w);
    } catch (e: any) {
      toast.error(e?.message ?? "Не вдалось прочитати файл");
    } finally {
      setParsing(false);
    }
  };

  const upload = async () => {
    setUploading(true);
    try {
      const { data, error } = await supabase.functions.invoke("results-ingest", {
        body: { event_id: eventId, results: rows },
      });
      if (error) throw error;
      setResult(data as any);
      toast.success(`Зараховано: ${(data as any).upserted}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Помилка завантаження");
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setRows([]); setWarnings([]); setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <FileSpreadsheet className="h-4 w-4" /> Імпорт CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Імпорт результатів з CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground mb-1">Очікувані колонки (перший рядок — заголовок):</p>
            <p><code>bib, time, chip_time, gun_time, position, notes</code></p>
            <p className="mt-1">Час: число секунд або <code>hh:mm:ss</code> / <code>mm:ss</code>. Роздільник: кома або крапка з комою.</p>
          </div>

          <div>
            <Label htmlFor="csv-file">CSV файл</Label>
            <input
              id="csv-file"
              type="file"
              accept=".csv,text/csv"
              className="mt-1.5 block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground hover:file:bg-primary/90"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onFile(f);
              }}
            />
          </div>

          {parsing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Парсинг…
            </div>
          )}

          {warnings.length > 0 && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700">
              <div className="flex items-center gap-1.5 font-semibold mb-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Попередження
              </div>
              {warnings.map((w, i) => <div key={i}>• {w}</div>)}
            </div>
          )}

          {rows.length > 0 && !result && (
            <div className="space-y-2">
              <div className="text-sm">
                Готово до імпорту: <strong>{rows.length}</strong> рядків
              </div>
              <div className="max-h-48 overflow-auto rounded-lg border border-border text-xs">
                <table className="w-full">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="px-2 py-1 text-left">BIB</th>
                      <th className="px-2 py-1 text-left">Час (с)</th>
                      <th className="px-2 py-1 text-left">Chip</th>
                      <th className="px-2 py-1 text-left">Gun</th>
                      <th className="px-2 py-1 text-left">Місце</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 50).map((r, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-2 py-1">{r.bib}</td>
                        <td className="px-2 py-1">{r.time_seconds ?? "—"}</td>
                        <td className="px-2 py-1">{r.chip_time_seconds ?? "—"}</td>
                        <td className="px-2 py-1">{r.gun_time_seconds ?? "—"}</td>
                        <td className="px-2 py-1">{r.finish_position ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 50 && (
                  <div className="px-2 py-1 text-muted-foreground">…ще {rows.length - 50}</div>
                )}
              </div>
              <Button onClick={upload} disabled={uploading} className="w-full">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Завантажити {rows.length} результатів
              </Button>
            </div>
          )}

          {result && (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4">
              <div className="flex items-center gap-2 font-semibold text-emerald-600">
                <CheckCircle2 className="h-5 w-5" /> Імпорт завершено
              </div>
              <div className="mt-2 text-sm">
                Прийнято: <strong>{result.received}</strong> · Збережено: <strong>{result.upserted}</strong>
                {result.errors.length > 0 && <> · Помилок: <strong>{result.errors.length}</strong></>}
              </div>
              {result.errors.length > 0 && (
                <details className="mt-2 text-xs">
                  <summary className="cursor-pointer">Деталі помилок</summary>
                  <ul className="mt-1 space-y-0.5 max-h-40 overflow-auto">
                    {result.errors.slice(0, 100).map((e, i) => (
                      <li key={i}>BIB {e.bib ?? "?"} (рядок {e.index + 1}): {e.error}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
