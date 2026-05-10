import { useEffect, useState } from "react";
import { Map, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";

interface GpxTrack {
  id: string;
  distance_id: string | null;
  name: string;
  file_url: string;
  file_size: number | null;
}

interface DistanceLite {
  id: string;
  name?: string | null;
  distance_km: number;
}

export const GpxTracksList = ({ eventId, distances = [] }: { eventId: string; distances?: DistanceLite[] }) => {
  const { lang } = useApp();
  const [tracks, setTracks] = useState<GpxTrack[]>([]);

  useEffect(() => {
    if (!eventId) return;
    supabase
      .from("event_gpx_tracks" as any)
      .select("id,distance_id,name,file_url,file_size")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true })
      .then(({ data }) => setTracks((data as any) ?? []));
  }, [eventId]);

  if (tracks.length === 0) return null;

  const title = lang === "uk" ? "GPX треки" : "GPX tracks";
  const dl = lang === "uk" ? "Завантажити" : "Download";

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <h3 className="font-display text-lg font-bold flex items-center gap-2">
        <Map className="h-5 w-5 text-primary" />
        {title}
      </h3>
      <div className="space-y-2">
        {tracks.map((t) => {
          const d = distances.find((x) => x.id === t.distance_id);
          return (
            <div key={t.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{t.name}</div>
                {d && (
                  <div className="text-xs text-muted-foreground">
                    {d.distance_km} km{d.name ? ` · ${d.name}` : ""}
                  </div>
                )}
              </div>
              <Button asChild size="sm" variant="outline">
                <a href={t.file_url} download target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4" /> {dl}
                </a>
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
