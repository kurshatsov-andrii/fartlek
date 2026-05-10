import { useEffect, useRef, useState } from "react";
import { Loader2, Upload, Trash2, Download, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";

interface GpxTrack {
  id: string;
  event_id: string;
  distance_id: string | null;
  name: string;
  file_url: string;
  storage_path: string;
  file_size: number | null;
  created_at: string;
}

interface DistanceLite {
  id: string;
  name: string | null;
  distance_km: number;
}

interface Props {
  eventId: string;
  distances?: DistanceLite[];
}

const labels = {
  uk: {
    title: "GPX треки",
    upload: "Завантажити GPX",
    name: "Назва треку",
    distance: "Дистанція",
    anyDistance: "Без прив'язки",
    save: "Зберегти",
    download: "Завантажити",
    delete: "Видалити",
    confirmDelete: "Видалити цей трек?",
    empty: "Немає завантажених треків",
    invalid: "Файл має бути .gpx",
  },
  en: {
    title: "GPX tracks",
    upload: "Upload GPX",
    name: "Track name",
    distance: "Distance",
    anyDistance: "Not assigned",
    save: "Save",
    download: "Download",
    delete: "Delete",
    confirmDelete: "Delete this track?",
    empty: "No tracks uploaded",
    invalid: "File must be .gpx",
  },
};

export const GpxTracksManager = ({ eventId, distances = [] }: Props) => {
  const { lang } = useApp();
  const L = labels[lang === "uk" ? "uk" : "en"];
  const [tracks, setTracks] = useState<GpxTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [distanceId, setDistanceId] = useState<string>("none");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("event_gpx_tracks" as any)
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });
    setTracks((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { if (eventId) load(); }, [eventId]);

  const upload = async (file: File) => {
    if (!/\.gpx$/i.test(file.name)) {
      toast.error(L.invalid);
      return;
    }
    setUploading(true);
    try {
      const safeName = file.name.replace(/[^a-z0-9._-]+/gi, "_");
      const path = `${eventId}/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage.from("event-gpx").upload(path, file, {
        contentType: "application/gpx+xml",
        upsert: false,
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("event-gpx").getPublicUrl(path);
      const { error: insErr } = await supabase.from("event_gpx_tracks" as any).insert({
        event_id: eventId,
        distance_id: distanceId === "none" ? null : distanceId,
        name: name.trim() || file.name.replace(/\.gpx$/i, ""),
        file_url: pub.publicUrl,
        storage_path: path,
        file_size: file.size,
      });
      if (insErr) throw insErr;
      setName("");
      setDistanceId("none");
      if (fileRef.current) fileRef.current.value = "";
      toast.success("OK");
      load();
    } catch (e: any) {
      toast.error(e.message ?? String(e));
    } finally {
      setUploading(false);
    }
  };

  const remove = async (track: GpxTrack) => {
    if (!confirm(L.confirmDelete)) return;
    await supabase.storage.from("event-gpx").remove([track.storage_path]);
    const { error } = await supabase.from("event_gpx_tracks" as any).delete().eq("id", track.id);
    if (error) toast.error(error.message);
    else { toast.success("OK"); load(); }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Map className="h-5 w-5 text-primary" />
        <h3 className="font-display text-lg font-bold">{L.title}</h3>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{L.name}</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="10K route" />
        </div>
        {distances.length > 0 && (
          <div className="space-y-1.5">
            <Label>{L.distance}</Label>
            <Select value={distanceId} onValueChange={setDistanceId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{L.anyDistance}</SelectItem>
                {distances.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.distance_km} km{d.name ? ` · ${d.name}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div>
        <input
          ref={fileRef}
          type="file"
          accept=".gpx,application/gpx+xml,application/xml"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }}
        />
        <Button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {L.upload}
        </Button>
      </div>

      <div className="space-y-2">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : tracks.length === 0 ? (
          <p className="text-sm text-muted-foreground">{L.empty}</p>
        ) : (
          tracks.map((t) => {
            const dist = distances.find((d) => d.id === t.distance_id);
            return (
              <div key={t.id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{t.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {dist ? `${dist.distance_km} km${dist.name ? ` · ${dist.name}` : ""}` : L.anyDistance}
                    {t.file_size ? ` · ${(t.file_size / 1024).toFixed(1)} KB` : ""}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button asChild size="sm" variant="outline">
                    <a href={t.file_url} download target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => remove(t)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
