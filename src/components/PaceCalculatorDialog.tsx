import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/contexts/AppContext";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  distances?: { distance_km: number; name?: string | null }[];
}

const STD = [1, 3, 5, 10, 21.0975, 42.195, 50, 100];

const fmtTime = (totalSeconds: number) => {
  if (!isFinite(totalSeconds) || totalSeconds <= 0) return "—";
  const s = Math.round(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
};

const fmtPace = (secPerKm: number) => {
  if (!isFinite(secPerKm) || secPerKm <= 0) return "—";
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};

export const PaceCalculatorDialog = ({ open, onOpenChange, distances = [] }: Props) => {
  const { lang } = useApp();
  const uk = lang === "uk";

  // Build distance options
  const options = useMemo(() => {
    const fromEvent = distances.map((d) => ({
      km: Number(d.distance_km),
      label: `${d.distance_km} ${uk ? "км" : "km"}${d.name ? ` — ${d.name}` : ""}`,
    }));
    const stds = STD.map((km) => ({ km, label: `${km} ${uk ? "км" : "km"}` }));
    const map = new Map<number, { km: number; label: string }>();
    [...fromEvent, ...stds].forEach((o) => { if (!map.has(o.km)) map.set(o.km, o); });
    return Array.from(map.values()).sort((a, b) => a.km - b.km);
  }, [distances, uk]);

  const [km, setKm] = useState<number>(options[0]?.km ?? 5);
  const [customKm, setCustomKm] = useState("");
  const distanceKm = customKm ? Number(customKm.replace(",", ".")) : km;

  // Mode: from pace -> time, or from time -> pace
  const [paceMin, setPaceMin] = useState("5");
  const [paceSec, setPaceSec] = useState("00");
  const [timeH, setTimeH] = useState("0");
  const [timeM, setTimeM] = useState("25");
  const [timeS, setTimeS] = useState("00");

  const paceSecPerKm = (Number(paceMin) || 0) * 60 + (Number(paceSec) || 0);
  const totalTimeSec = (Number(timeH) || 0) * 3600 + (Number(timeM) || 0) * 60 + (Number(timeS) || 0);

  const computedTime = paceSecPerKm > 0 && distanceKm > 0 ? paceSecPerKm * distanceKm : 0;
  const computedPace = totalTimeSec > 0 && distanceKm > 0 ? totalTimeSec / distanceKm : 0;
  const computedSpeed = totalTimeSec > 0 && distanceKm > 0 ? (distanceKm / (totalTimeSec / 3600)) : 0;
  const computedSpeedFromPace = paceSecPerKm > 0 ? 3600 / paceSecPerKm : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{uk ? "Біговий калькулятор" : "Running calculator"}</DialogTitle>
          <DialogDescription>
            {uk ? "Розрахуйте темп або фінішний час" : "Calculate your pace or finish time"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{uk ? "Дистанція" : "Distance"}</Label>
            <div className="flex flex-wrap gap-2">
              {options.map((o) => (
                <Button
                  key={o.km}
                  type="button"
                  size="sm"
                  variant={!customKm && km === o.km ? "default" : "outline"}
                  onClick={() => { setKm(o.km); setCustomKm(""); }}
                >
                  {o.label}
                </Button>
              ))}
            </div>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder={uk ? "Своя дистанція, км" : "Custom distance, km"}
              value={customKm}
              onChange={(e) => setCustomKm(e.target.value)}
            />
          </div>

          <div className="rounded-lg border border-border p-3 space-y-2">
            <Label>{uk ? "Темп (хв/км)" : "Pace (min/km)"}</Label>
            <div className="flex items-center gap-2">
              <Input type="number" min="0" max="59" value={paceMin} onChange={(e) => setPaceMin(e.target.value)} className="w-20" />
              <span>:</span>
              <Input type="number" min="0" max="59" value={paceSec} onChange={(e) => setPaceSec(e.target.value)} className="w-20" />
            </div>
            <div className="text-sm text-muted-foreground">
              {uk ? "Час на " : "Time for "}{distanceKm || 0} {uk ? "км" : "km"}:{" "}
              <span className="font-semibold text-foreground">{fmtTime(computedTime)}</span>
              {computedSpeedFromPace > 0 && (
                <> · {computedSpeedFromPace.toFixed(2)} {uk ? "км/год" : "km/h"}</>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border p-3 space-y-2">
            <Label>{uk ? "Цільовий час (год:хв:сек)" : "Target time (h:m:s)"}</Label>
            <div className="flex items-center gap-2">
              <Input type="number" min="0" value={timeH} onChange={(e) => setTimeH(e.target.value)} className="w-20" />
              <span>:</span>
              <Input type="number" min="0" max="59" value={timeM} onChange={(e) => setTimeM(e.target.value)} className="w-20" />
              <span>:</span>
              <Input type="number" min="0" max="59" value={timeS} onChange={(e) => setTimeS(e.target.value)} className="w-20" />
            </div>
            <div className="text-sm text-muted-foreground">
              {uk ? "Темп: " : "Pace: "}
              <span className="font-semibold text-foreground">{fmtPace(computedPace)}</span> {uk ? "хв/км" : "min/km"}
              {computedSpeed > 0 && (
                <> · {computedSpeed.toFixed(2)} {uk ? "км/год" : "km/h"}</>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
