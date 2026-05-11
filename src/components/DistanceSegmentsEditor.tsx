import { useMemo } from "react";
import { Plus, X, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type SegmentSport =
  | "swim"
  | "bike"
  | "run"
  | "obstacle_run"
  | "kayak"
  | "ski"
  | "other";

export interface Segment {
  sport: SegmentSport;
  distance_km: string; // string in form
  note?: string;
}

interface Preset {
  id: string;
  label: string;
  discipline: string;
  segments: { sport: SegmentSport; distance_km: number }[];
  name?: string;
}

export const DISTANCE_PRESETS: Preset[] = [
  // Triathlon
  { id: "tri-sprint", label: "Triathlon · Sprint", discipline: "Sprint", name: "Sprint Triathlon", segments: [
    { sport: "swim", distance_km: 0.75 }, { sport: "bike", distance_km: 20 }, { sport: "run", distance_km: 5 } ] },
  { id: "tri-olympic", label: "Triathlon · Olympic", discipline: "Olympic", name: "Olympic Triathlon", segments: [
    { sport: "swim", distance_km: 1.5 }, { sport: "bike", distance_km: 40 }, { sport: "run", distance_km: 10 } ] },
  { id: "tri-half", label: "Triathlon · Half (70.3)", discipline: "Half (70.3)", name: "Half Triathlon", segments: [
    { sport: "swim", distance_km: 1.9 }, { sport: "bike", distance_km: 90 }, { sport: "run", distance_km: 21.1 } ] },
  { id: "tri-full", label: "Triathlon · Full (140.6)", discipline: "Full", name: "Full Triathlon", segments: [
    { sport: "swim", distance_km: 3.8 }, { sport: "bike", distance_km: 180 }, { sport: "run", distance_km: 42.2 } ] },
  // Duathlon
  { id: "du-sprint", label: "Duathlon · Sprint", discipline: "Sprint", name: "Sprint Duathlon", segments: [
    { sport: "run", distance_km: 5 }, { sport: "bike", distance_km: 20 }, { sport: "run", distance_km: 2.5 } ] },
  { id: "du-standard", label: "Duathlon · Standard", discipline: "Standard", name: "Standard Duathlon", segments: [
    { sport: "run", distance_km: 10 }, { sport: "bike", distance_km: 40 }, { sport: "run", distance_km: 5 } ] },
  // Aquathlon
  { id: "aqua-sprint", label: "Aquathlon · Sprint", discipline: "Sprint", name: "Sprint Aquathlon", segments: [
    { sport: "swim", distance_km: 0.75 }, { sport: "run", distance_km: 5 } ] },
  { id: "aqua-standard", label: "Aquathlon · Standard", discipline: "Standard", name: "Standard Aquathlon", segments: [
    { sport: "swim", distance_km: 1 }, { sport: "run", distance_km: 10 } ] },
];

const SPORT_META: Record<SegmentSport, { uk: string; en: string; emoji: string }> = {
  swim:         { uk: "Плавання",   en: "Swim",     emoji: "🏊" },
  bike:         { uk: "Вело",       en: "Bike",     emoji: "🚴" },
  run:          { uk: "Біг",        en: "Run",      emoji: "🏃" },
  obstacle_run: { uk: "Біг з перешкодами", en: "Obstacle run", emoji: "🪢" },
  kayak:        { uk: "Каяк",       en: "Kayak",    emoji: "🛶" },
  ski:          { uk: "Лижі",       en: "Ski",      emoji: "🎿" },
  other:        { uk: "Інше",       en: "Other",    emoji: "•" },
};

export const sportLabel = (s: SegmentSport, lang: "uk" | "en") => SPORT_META[s][lang];
export const sportEmoji = (s: SegmentSport) => SPORT_META[s].emoji;

interface Props {
  lang: "uk" | "en";
  segments: Segment[];
  discipline: string;
  obstacleCount: string;
  onChange: (next: { segments: Segment[]; discipline: string; obstacleCount: string }) => void;
}

export function DistanceSegmentsEditor({ lang, segments, discipline, obstacleCount, onChange }: Props) {
  const total = useMemo(
    () => segments.reduce((sum, s) => sum + (parseFloat(s.distance_km) || 0), 0),
    [segments]
  );
  const isOcrOnly = segments.length === 1 && segments[0].sport === "obstacle_run";

  const update = (patch: Partial<{ segments: Segment[]; discipline: string; obstacleCount: string }>) =>
    onChange({ segments, discipline, obstacleCount, ...patch });

  const updateSeg = (i: number, patch: Partial<Segment>) => {
    const next = segments.map((s, k) => (k === i ? { ...s, ...patch } : s));
    update({ segments: next });
  };

  const addSeg = (sport: SegmentSport = "run") =>
    update({ segments: [...segments, { sport, distance_km: "" }] });

  const removeSeg = (i: number) =>
    update({ segments: segments.filter((_, k) => k !== i) });

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= segments.length) return;
    const next = [...segments];
    [next[i], next[j]] = [next[j], next[i]];
    update({ segments: next });
  };

  const applyPreset = (id: string) => {
    if (!id) return;
    if (id === "ocr") {
      update({
        segments: [{ sport: "obstacle_run", distance_km: "5" }],
        discipline: "OCR",
      });
      return;
    }
    const p = DISTANCE_PRESETS.find((x) => x.id === id);
    if (!p) return;
    update({
      segments: p.segments.map((s) => ({ sport: s.sport, distance_km: String(s.distance_km) })),
      discipline: p.discipline,
    });
  };

  return (
    <div className="space-y-3 rounded-md border border-dashed border-border bg-muted/30 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1 min-w-[180px]">
          <Label className="text-xs text-muted-foreground">
            {lang === "uk" ? "Дисципліни (мультиспорт)" : "Disciplines (multisport)"}
          </Label>
          <p className="text-xs text-muted-foreground/80 mt-0.5">
            {lang === "uk"
              ? "Залиште порожнім для одиничної дистанції. Загальний км рахується автоматично."
              : "Leave empty for single-discipline. Total km is computed automatically."}
          </p>
        </div>
        <Select value="" onValueChange={applyPreset}>
          <SelectTrigger className="w-auto min-w-[180px]">
            <SelectValue placeholder={lang === "uk" ? "Шаблон…" : "Preset…"} />
          </SelectTrigger>
          <SelectContent>
            {DISTANCE_PRESETS.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
            ))}
            <SelectItem value="ocr">OCR · {lang === "uk" ? "перешкоди" : "obstacles"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {segments.length > 0 && (
        <div className="space-y-2">
          {segments.map((s, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-1 text-xs text-muted-foreground pb-2">{i + 1}.</div>
              <div className="col-span-5 sm:col-span-4">
                <Label className="text-xs text-muted-foreground">{lang === "uk" ? "Вид" : "Sport"}</Label>
                <Select value={s.sport} onValueChange={(v) => updateSeg(i, { sport: v as SegmentSport })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SPORT_META) as SegmentSport[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {sportEmoji(k)} {sportLabel(k, lang)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-3 sm:col-span-3">
                <Label className="text-xs text-muted-foreground">км</Label>
                <Input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0"
                  value={s.distance_km}
                  onChange={(e) => updateSeg(i, { distance_km: e.target.value })}
                />
              </div>
              <div className="col-span-3 sm:col-span-4 flex items-center justify-end gap-1">
                <Button type="button" variant="ghost" size="icon" onClick={() => move(i, -1)} disabled={i === 0}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => move(i, +1)} disabled={i === segments.length - 1}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeSeg(i)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => addSeg("swim")}>
          <Plus className="h-3 w-3 mr-1" /> 🏊 {lang === "uk" ? "Плавання" : "Swim"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => addSeg("bike")}>
          <Plus className="h-3 w-3 mr-1" /> 🚴 {lang === "uk" ? "Вело" : "Bike"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => addSeg("run")}>
          <Plus className="h-3 w-3 mr-1" /> 🏃 {lang === "uk" ? "Біг" : "Run"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => addSeg("obstacle_run")}>
          <Plus className="h-3 w-3 mr-1" /> 🪢 OCR
        </Button>
      </div>

      {segments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border">
          <div>
            <Label className="text-xs text-muted-foreground">
              {lang === "uk" ? "Ярлик дистанції" : "Discipline label"}
            </Label>
            <Input
              placeholder={lang === "uk" ? "Sprint / Olympic / 70.3 …" : "Sprint / Olympic / 70.3 …"}
              value={discipline}
              onChange={(e) => update({ discipline: e.target.value })}
            />
          </div>
          {isOcrOnly && (
            <div>
              <Label className="text-xs text-muted-foreground">
                {lang === "uk" ? "К-сть перешкод" : "Obstacles"}
              </Label>
              <Input
                type="number"
                step="1"
                inputMode="numeric"
                placeholder="0"
                value={obstacleCount}
                onChange={(e) => update({ obstacleCount: e.target.value })}
              />
            </div>
          )}
          <div className="sm:col-span-2 text-sm text-muted-foreground">
            {lang === "uk" ? "Загалом" : "Total"}:{" "}
            <span className="font-semibold text-foreground">{total.toFixed(2)} {lang === "uk" ? "км" : "km"}</span>
          </div>
        </div>
      )}
    </div>
  );
}
