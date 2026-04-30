import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, MapPin, Plus, Search } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CLUB_ACTIVITY_TYPES, CLUB_ACTIVITY_LABELS, type Club, type ClubActivityType } from "@/lib/clubs";
import { SEO } from "@/components/SEO";

const ClubsCatalog = () => {
  const { lang } = useApp();
  const { user, isOrganizer } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [q, setQ] = useState("");
  const [city, setCity] = useState<string>("all");
  const [activity, setActivity] = useState<string>("all");
  const PAGE_SIZE = 9;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const T = lang === "uk" ? {
    title: "Клуби", subtitle: "Бігові клуби України", search: "Пошук за назвою",
    allCities: "Усі міста", allActivities: "Усі види", empty: "Клуби не знайдено",
    members: "учасників", noLogo: "🏃", loadMore: "Завантажити ще",
  } : {
    title: "Clubs", subtitle: "Running clubs of Ukraine", search: "Search by name",
    allCities: "All cities", allActivities: "All types", empty: "No clubs found",
    members: "members", noLogo: "🏃", loadMore: "Load more",
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("clubs" as any).select("*").order("name");
      setClubs((data ?? []) as any);
      setLoading(false);
    })();
  }, []);

  const cities = useMemo(() => {
    const s = new Set<string>();
    clubs.forEach((c) => { if (c.city?.trim()) s.add(c.city.trim()); });
    return Array.from(s).sort();
  }, [clubs]);

  const filtered = useMemo(() => clubs.filter((c) => {
    if (q && !c.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (city !== "all" && c.city !== city) return false;
    if (activity !== "all" && !(c.activity_types ?? []).includes(activity as ClubActivityType)) return false;
    return true;
  }), [clubs, q, city, activity]);

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [q, city, activity]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={lang === "uk" ? "Бігові клуби України — Fartlek Events" : "Running clubs of Ukraine — Fartlek Events"}
        description={lang === "uk"
          ? "Найкращі бігові клуби у місті Київ, Харків, Дніпро, Одеса, Львів, Кривий Ріг, Вінниця, Тернопіль та інші."
          : "Best running clubs in Kyiv, Kharkiv, Dnipro, Odesa, Lviv, Kryvyi Rih, Vinnytsia, Ternopil and other cities of Ukraine."}
        canonical="/clubs"
      />
      <Header />
      <main className="flex-1 container max-w-6xl py-10">
        <h1 className="font-display text-4xl font-bold">{T.title}</h1>
        <p className="text-muted-foreground mt-1">{T.subtitle}</p>

        <div className="mt-6 grid sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={T.search} className="pl-9" />
          </div>
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{T.allCities}</SelectItem>
              {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={activity} onValueChange={setActivity}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{T.allActivities}</SelectItem>
              {CLUB_ACTIVITY_TYPES.map((a) => (
                <SelectItem key={a} value={a}>{CLUB_ACTIVITY_LABELS[lang as "uk" | "en"][a]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl mt-6">
            <p className="text-muted-foreground">{T.empty}</p>
          </div>
        ) : (
          <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {visible.map((c) => (
              <Link key={c.id} to={`/clubs/${c.slug ?? c.id}`} className="bg-card p-5 rounded-2xl shadow-card hover:shadow-elegant transition-base block">
                <div className="flex items-center gap-4">
                  {c.logo_url ? (
                    <img src={c.logo_url} alt={c.name} className="h-16 w-16 rounded-lg object-cover border border-border" />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center text-2xl">{T.noLogo}</div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-display font-bold truncate">{c.name}</h3>
                    {c.city && (
                      <p className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" /> {c.city}
                      </p>
                    )}
                  </div>
                </div>
                {(c.activity_types ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {c.activity_types.map((a) => (
                      <Badge key={a} variant="secondary" className="text-xs">
                        {CLUB_ACTIVITY_LABELS[lang as "uk" | "en"][a]}
                      </Badge>
                    ))}
                  </div>
                )}
                {c.description && (
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{c.description}</p>
                )}
              </Link>
            ))}
          </div>
          {visibleCount < filtered.length && (
            <div className="flex justify-center mt-8">
              <Button variant="outline" size="lg" onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}>
                {T.loadMore} ({filtered.length - visibleCount})
              </Button>
            </div>
          )}
          </>
        )}

        <div className="mt-12 flex flex-col items-center gap-2 text-center">
          <Button
            size="lg"
            onClick={() => {
              if (!user || !isOrganizer) navigate("/auth?role=organizer");
              else navigate("/clubs/edit");
            }}
          >
            <Plus className="h-4 w-4" />
            {lang === "uk" ? "Додати клуб" : "Add club"}
          </Button>
          <p className="text-xs text-muted-foreground max-w-md">
            {lang === "uk"
              ? "Додавати клуб можуть лише користувачі, зареєстровані як Організатор. Якщо ви ще не організатор — оберіть цю роль під час реєстрації."
              : "Only users registered as Organizer can add a club. If you are not an organizer yet — pick this role during sign up."}
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ClubsCatalog;
