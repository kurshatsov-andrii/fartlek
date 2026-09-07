import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2, MapPin, Calendar as CalendarIcon, ExternalLink, X, Search } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { eventCity } from "@/lib/utils";
import { findCityCoords, prettyCity } from "@/lib/uaCities";

type Source = "event" | "start" | "calendar";

interface MapItem {
  id: string;
  title: string;
  date: string | null;
  city: string;
  coords: [number, number];
  source: Source;
  href: string;
  external: boolean;
  distances: string;
}

interface CityGroup {
  city: string;
  coords: [number, number];
  items: MapItem[];
}

const SOURCE_LABEL: Record<Source, string> = {
  event: "Подія на платформі",
  start: "Старт",
  calendar: "Календар",
};

const fmtDate = (d: string | null) => {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}.${m}.${y}`;
};

const markerIcon = (city: string, count: number, active: boolean) =>
  L.divIcon({
    className: "",
    html: `<div style="transform:translate(-50%,-100%);white-space:nowrap;display:flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;font:600 12px/1.2 system-ui,sans-serif;box-shadow:0 4px 12px rgba(0,0,0,.25);background:${active ? "hsl(24 95% 53%)" : "#ffffff"};color:${active ? "#ffffff" : "#1f2937"};border:2px solid ${active ? "#ffffff" : "hsl(24 95% 53%)"}">📍 ${city} <span style="background:${active ? "rgba(255,255,255,.25)" : "hsl(24 95% 53%)"};color:#fff;border-radius:999px;padding:0 6px">${count}</span></div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });

const FlyTo = ({ coords }: { coords: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, Math.max(map.getZoom(), 8), { duration: 0.8 });
  }, [coords, map]);
  return null;
};

const EventsMap = () => {
  const [items, setItems] = useState<MapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const todayIso = new Date().toISOString().slice(0, 10);
      const [{ data: ev }, { data: starts }, { data: cal }] = await Promise.all([
        supabase
          .from("events")
          .select("id, slug, title, event_date, location, distances(distance_km, is_active)")
          .eq("status", "published")
          .gte("event_date", todayIso),
        supabase
          .from("telegram_starts")
          .select("id, slug, title, event_date, city, distances_km")
          .eq("status", "published")
          .gte("event_date", todayIso),
        supabase
          .from("calendar_events" as any)
          .select("id, title, event_date, location, distances, url")
          .gte("event_date", todayIso),
      ]);

      const acc: MapItem[] = [];

      ((ev as any[]) ?? []).forEach((e) => {
        const city = eventCity(e.location);
        const coords = city ? findCityCoords(city) : null;
        if (!coords) return;
        acc.push({
          id: `e-${e.id}`,
          title: e.title,
          date: e.event_date,
          city: prettyCity(city),
          coords,
          source: "event",
          href: `/events/${e.slug ?? e.id}`,
          external: false,
          distances: (e.distances ?? [])
            .filter((d: any) => d.is_active !== false)
            .map((d: any) => `${d.distance_km} км`)
            .join(", "),
        });
      });

      ((starts as any[]) ?? []).forEach((s) => {
        const city = (s.city ?? "").split(",")[0].trim();
        const coords = city ? findCityCoords(city) : null;
        if (!coords) return;
        acc.push({
          id: `s-${s.id}`,
          title: s.title || "Без назви",
          date: s.event_date,
          city: prettyCity(city),
          coords,
          source: "start",
          href: `/starts/${s.slug}`,
          external: false,
          distances: [...(s.distances_km ?? [])]
            .sort((a: number, b: number) => Number(b) - Number(a))
            .map((d: number) => `${d} км`)
            .join(", "),
        });
      });

      ((cal as any[]) ?? []).forEach((c) => {
        const city = eventCity(c.location);
        const coords = city ? findCityCoords(city) : null;
        if (!coords) return;
        acc.push({
          id: `c-${c.id}`,
          title: c.title,
          date: c.event_date,
          city: prettyCity(city),
          coords,
          source: "calendar",
          href: c.url || "",
          external: !!c.url && !c.url.startsWith("/"),
          distances: c.distances ?? "",
        });
      });

      // de-duplicate по назві + даті
      const seen = new Set<string>();
      const unique = acc.filter((i) => {
        const key = `${i.title.trim().toLowerCase()}|${i.date}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setItems(unique);
      setLoading(false);
    })();
  }, []);

  const groups = useMemo<CityGroup[]>(() => {
    const map = new Map<string, CityGroup>();
    items.forEach((i) => {
      const g = map.get(i.city) ?? { city: i.city, coords: i.coords, items: [] };
      g.items.push(i);
      map.set(i.city, g);
    });
    return Array.from(map.values())
      .map((g) => ({
        ...g,
        items: g.items.sort((a, b) => (a.date || "").localeCompare(b.date || "")),
      }))
      .sort((a, b) => b.items.length - a.items.length);
  }, [items]);

  const visibleGroups = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return groups;
    return groups.filter((g) => g.city.toLowerCase().includes(s));
  }, [groups, q]);

  const activeGroup = groups.find((g) => g.city === selected) ?? null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Мапа спортивних подій України — Fartlek"
        description="Інтерактивна карта забігів, трейлів і стартів по містах України. Обери місто на карті та переходь до реєстрації."
        canonical="/map"
      />
      <Header />
      <main className="flex-1 container py-8">
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Мапа спортивних подій України</h1>
        <p className="text-muted-foreground mb-6">
          Натисни на місто, щоб побачити старти та перейти до реєстрації. Усього {items.length} подій у {groups.length} містах.
        </p>

        {loading ? (
          <div className="h-[60vh] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
            <Card className="overflow-hidden h-[50vh] lg:h-[72vh]">
              <MapContainer
                center={[48.9, 31.2]}
                zoom={6}
                scrollWheelZoom
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FlyTo coords={activeGroup?.coords ?? null} />
                {visibleGroups.map((g) => (
                  <Marker
                    key={g.city}
                    position={g.coords}
                    icon={markerIcon(g.city, g.items.length, g.city === selected)}
                    eventHandlers={{ click: () => setSelected(g.city) }}
                  />
                ))}
              </MapContainer>
            </Card>

            <div className="flex flex-col gap-3 lg:h-[72vh]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Пошук міста" className="pl-9" />
              </div>

              {activeGroup ? (
                <Card className="flex-1 overflow-auto p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h2 className="font-display text-xl font-bold flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />{activeGroup.city}
                      </h2>
                      <p className="text-sm text-muted-foreground">{activeGroup.items.length} подій</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSelected(null)}><X className="h-4 w-4" /></Button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {activeGroup.items.map((i) => (
                      <div key={i.id} className="rounded-lg border border-border p-3">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mb-1">
                          {i.date && <span className="inline-flex items-center gap-1"><CalendarIcon className="h-3.5 w-3.5" />{fmtDate(i.date)}</span>}
                          <span className="px-1.5 py-0.5 rounded bg-muted">{SOURCE_LABEL[i.source]}</span>
                        </div>
                        <h3 className="font-semibold leading-snug mb-1">{i.title}</h3>
                        {i.distances && <p className="text-xs text-muted-foreground mb-2">{i.distances}</p>}
                        {i.href && (
                          i.external ? (
                            <Button asChild size="sm" variant="secondary" className="w-full">
                              <a href={i.href} target="_blank" rel="noreferrer">Реєстрація <ExternalLink className="h-3.5 w-3.5 ml-1.5" /></a>
                            </Button>
                          ) : (
                            <Button asChild size="sm" className="w-full"><Link to={i.href}>Детальніше та реєстрація</Link></Button>
                          )
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              ) : (
                <Card className="flex-1 overflow-auto p-4">
                  <h2 className="font-semibold mb-3">Міста з подіями</h2>
                  <div className="flex flex-col">
                    {visibleGroups.map((g) => (
                      <button
                        key={g.city}
                        onClick={() => setSelected(g.city)}
                        className="flex items-center justify-between gap-2 py-2 px-2 rounded-md hover:bg-muted text-left"
                      >
                        <span className="inline-flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-primary" />{g.city}</span>
                        <span className="text-sm font-semibold text-muted-foreground">{g.items.length}</span>
                      </button>
                    ))}
                    {visibleGroups.length === 0 && <p className="text-sm text-muted-foreground">Нічого не знайдено</p>}
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default EventsMap;
