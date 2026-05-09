import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { Loader2, Shield, Calendar, Users, CreditCard, Edit, BarChart3, Ticket, Trash2, UsersRound, Eye, Search, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CLUB_ACTIVITY_TYPES, CLUB_ACTIVITY_LABELS, type Club } from "@/lib/clubs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AppRole = "participant" | "organizer" | "admin";

const ROLE_LABEL: Record<AppRole, string> = {
  participant: "Учасник",
  organizer: "Організатор",
  admin: "Адміністратор",
};

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [rolesByUser, setRolesByUser] = useState<Record<string, AppRole[]>>({});
  const [busy, setBusy] = useState(false);
  const [roleFilter, setRoleFilter] = useState<"all" | AppRole>("all");
  const [userSort, setUserSort] = useState<"newest" | "oldest" | "city_asc" | "city_desc" | "club_asc" | "club_desc">("newest");
  const [userLimit, setUserLimit] = useState(50);
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [clubFilter, setClubFilter] = useState<string>("all");
  const [eventStatusFilter, setEventStatusFilter] = useState<"all" | "published" | "cancelled" | "completed" | "draft">("all");
  const [clubs, setClubs] = useState<(Club & { owner_email?: string; owner_name?: string })[]>([]);
  const [clubSearch, setClubSearch] = useState("");
  const [clubCityFilter, setClubCityFilter] = useState<string>("all");
  const [clubActivityFilter, setClubActivityFilter] = useState<string>("all");

  const STATUS_LABEL: Record<string, string> = {
    published: "Опубліковано",
    cancelled: "Скасовано",
    completed: "Завершено",
    draft: "Чернетка",
  };
  const visibleEvents = eventStatusFilter === "all"
    ? events
    : events.filter((e) => e.status === eventStatusFilter);

  const ROLE_PRIORITY: Record<AppRole | "none", number> = { admin: 0, organizer: 1, participant: 2, none: 3 };
  const topRole = (uid: string): AppRole | "none" => {
    const rs = rolesByUser[uid] ?? [];
    if (rs.includes("admin")) return "admin";
    if (rs.includes("organizer")) return "organizer";
    if (rs.includes("participant")) return "participant";
    return "none";
  };
  const norm = (v: any) => (v ?? "").toString().trim();
  const normLower = (v: any) => norm(v).toLowerCase();

  const cityOptions = Array.from(
    new Map(
      users
        .filter((u) => norm(u.city) !== "")
        .map((u) => [normLower(u.city), norm(u.city)])
    ).entries()
  )
    .map(([key, label]) => ({ key, label }))
    .sort((a, b) => a.label.localeCompare(b.label, "uk"));

  const clubOptions = Array.from(
    new Map(
      users
        .filter((u) => norm(u.club) !== "")
        .map((u) => [normLower(u.club), norm(u.club)])
    ).entries()
  )
    .map(([key, label]) => ({ key, label }))
    .sort((a, b) => a.label.localeCompare(b.label, "uk"));

  const filteredUsers = users
    .filter((u) => {
      if (roleFilter === "all") return true;
      const rs = rolesByUser[u.id] ?? [];
      if (roleFilter === "participant") return rs.length === 0 || rs.includes("participant");
      return rs.includes(roleFilter);
    })
    .filter((u) => cityFilter === "all" || normLower(u.city) === cityFilter)
    .filter((u) => clubFilter === "all" || normLower(u.club) === clubFilter)
    .sort((a, b) => {
      if (userSort === "city_asc" || userSort === "city_desc") {
        const cmp = norm(a.city).localeCompare(norm(b.city), "uk");
        return userSort === "city_asc" ? cmp : -cmp;
      }
      if (userSort === "club_asc" || userSort === "club_desc") {
        const cmp = norm(a.club).localeCompare(norm(b.club), "uk");
        return userSort === "club_asc" ? cmp : -cmp;
      }
      const roleDiff = ROLE_PRIORITY[topRole(a.id)] - ROLE_PRIORITY[topRole(b.id)];
      if (roleDiff !== 0) return roleDiff;
      const ta = new Date(a.created_at ?? 0).getTime();
      const tb = new Date(b.created_at ?? 0).getTime();
      return userSort === "newest" ? tb - ta : ta - tb;
    });
  const visibleUsers = filteredUsers.slice(0, userLimit);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const [{ data: ev }, { data: ord }, { data: us }, { data: rs }, { data: cl }] = await Promise.all([
        supabase.from("events").select("*").order("created_at", { ascending: false }),
        supabase.from("wayforpay_orders").select("*").order("created_at", { ascending: false }).limit(1000),
        supabase.from("profiles").select("id, email, phone, full_name, city, club, created_at").order("created_at", { ascending: false }).range(0, 9999),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("clubs" as any).select("*").order("name"),
      ]);
      setEvents(ev ?? []);
      setOrders(ord ?? []);
      setUsers(us ?? []);
      const map: Record<string, AppRole[]> = {};
      (rs ?? []).forEach((r: any) => {
        map[r.user_id] = [...(map[r.user_id] ?? []), r.role as AppRole];
      });
      setRolesByUser(map);
      // enrich clubs with owner email/name
      const profilesMap = Object.fromEntries((us ?? []).map((p: any) => [p.id, p]));
      setClubs(((cl ?? []) as any[]).map((c) => ({
        ...c,
        owner_email: profilesMap[c.owner_id]?.email,
        owner_name: profilesMap[c.owner_id]?.full_name,
      })));
    })();
  }, [isAdmin]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!user) return <Navigate to="/auth?redirect=/admin" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const setEventStatus = async (id: string, status: string) => {
    setBusy(true);
    const { error } = await supabase.from("events").update({ status: status as any }).eq("id", id);
    setBusy(false);
    if (error) return toast.error(error.message);
    setEvents((s) => s.map((e) => (e.id === id ? { ...e, status } : e)));
    toast.success("Оновлено");
  };

  const grantRole = async (userId: string, role: AppRole) => {
    if ((rolesByUser[userId] ?? []).includes(role)) return;
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) return toast.error(error.message);
    setRolesByUser((s) => ({ ...s, [userId]: [...(s[userId] ?? []), role] }));
    toast.success(`Роль «${ROLE_LABEL[role]}» надано`);
  };

  const revokeRole = async (userId: string, role: AppRole) => {
    if (role === "admin" && userId === user.id) {
      return toast.error("Не можна зняти роль адміністратора з самого себе");
    }
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role);
    if (error) return toast.error(error.message);
    setRolesByUser((s) => ({ ...s, [userId]: (s[userId] ?? []).filter((r) => r !== role) }));
    toast.success(`Роль «${ROLE_LABEL[role]}» знято`);
  };

  const deleteUser = async (userId: string) => {
    if (userId === user.id) return toast.error("Не можна видалити самого себе");
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("admin-delete-user", {
      body: { user_id: userId },
    });
    setBusy(false);
    if (error || (data as any)?.error) {
      return toast.error((data as any)?.error ?? error?.message ?? "Помилка видалення");
    }
    setUsers((s) => s.filter((u) => u.id !== userId));
    setRolesByUser((s) => {
      const { [userId]: _, ...rest } = s;
      return rest;
    });
    toast.success("Користувача видалено");
  };

  const deleteClub = async (clubId: string, clubName: string) => {
    if (!confirm(`Видалити клуб «${clubName}» назавжди?`)) return;
    const { error } = await supabase.from("clubs" as any).delete().eq("id", clubId);
    if (error) return toast.error(error.message);
    setClubs((s) => s.filter((c) => c.id !== clubId));
    toast.success("Клуб видалено");
  };

  const filteredClubs = clubs.filter((c) => {
    if (clubSearch && !c.name.toLowerCase().includes(clubSearch.toLowerCase())) return false;
    if (clubCityFilter !== "all" && (c.city ?? "").toLowerCase() !== clubCityFilter) return false;
    if (clubActivityFilter !== "all" && !(c.activity_types ?? []).includes(clubActivityFilter as any)) return false;
    return true;
  });

  const clubCityOptions = Array.from(
    new Map(
      clubs
        .filter((c) => norm(c.city) !== "")
        .map((c) => [normLower(c.city), norm(c.city)])
    ).entries()
  ).map(([key, label]) => ({ key, label })).sort((a, b) => a.label.localeCompare(b.label, "uk"));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-10">
        <div className="flex items-center justify-between gap-3 mb-8 flex-wrap">
          <div className="flex items-center gap-3">
            <Shield className="h-7 w-7 text-primary" />
            <h1 className="font-display text-3xl font-bold">Адмін-панель</h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/campaigns">📧 Розсилки</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/unsubscribes">🚫 Відписки</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/survey">💬 Опитування</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/sessions">👁️ Сесії</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/seo">🔍 SEO</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/carousel">🖼️ Карусель</Link>
            </Button>
          </div>
        </div>
        <Tabs defaultValue="events" className="space-y-6">
          <TabsList>
            <TabsTrigger value="events"><Calendar className="h-4 w-4 mr-2" />Події ({events.length})</TabsTrigger>
            <TabsTrigger value="payments"><CreditCard className="h-4 w-4 mr-2" />Платежі ({orders.length})</TabsTrigger>
            <TabsTrigger value="users"><Users className="h-4 w-4 mr-2" />Користувачі ({users.length})</TabsTrigger>
            <TabsTrigger value="clubs"><UsersRound className="h-4 w-4 mr-2" />Клуби ({clubs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground mr-1">Сортувати за статусом:</span>
              {([
                { v: "all", label: `Усі (${events.length})` },
                { v: "published", label: `Опубліковані (${events.filter(e => e.status === "published").length})` },
                { v: "cancelled", label: `Скасовані (${events.filter(e => e.status === "cancelled").length})` },
                { v: "completed", label: `Завершені (${events.filter(e => e.status === "completed").length})` },
                { v: "draft", label: `Чернетки (${events.filter(e => e.status === "draft").length})` },
              ] as const).map((opt) => (
                <Button
                  key={opt.v}
                  size="sm"
                  variant={eventStatusFilter === opt.v ? "default" : "outline"}
                  onClick={() => setEventStatusFilter(opt.v)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
            {visibleEvents.map((e) => (
              <div key={e.id} className="bg-card p-4 rounded-xl flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{e.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {e.event_date} · {e.organizer_name} · {STATUS_LABEL[e.status] ?? e.status}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline"><Link to={`/events/${e.id}`}>Перегляд</Link></Button>
                  <Button asChild size="sm" variant="outline"><Link to={`/organizer/events/${e.id}`}><Edit className="h-4 w-4" /> Редагувати</Link></Button>
                  <Button asChild size="sm" variant="outline" title="Аналітика"><Link to={`/organizer/events/${e.id}/analytics`}><BarChart3 className="h-4 w-4" /></Link></Button>
                  <Button asChild size="sm" variant="outline" title="Промокоди"><Link to={`/organizer/events/${e.id}/promo-codes`}><Ticket className="h-4 w-4" /></Link></Button>
                  <Button asChild size="sm" variant="outline" title="Співорганізатори"><Link to={`/admin/events/${e.id}/co-organizers`}><UserPlus className="h-4 w-4" /></Link></Button>
                  {e.status !== "published" && <Button size="sm" disabled={busy} onClick={() => setEventStatus(e.id, "published")}>Опублікувати</Button>}
                  {e.status !== "completed" && <Button size="sm" variant="secondary" disabled={busy} onClick={() => setEventStatus(e.id, "completed")}>Завершити</Button>}
                  {e.status !== "cancelled" && <Button size="sm" variant="destructive" disabled={busy} onClick={() => setEventStatus(e.id, "cancelled")}>Скасувати</Button>}
                </div>
              </div>
            ))}
            {visibleEvents.length === 0 && (
              <div className="bg-card p-6 rounded-xl text-center text-muted-foreground">Немає подій</div>
            )}
          </TabsContent>

          <TabsContent value="payments" className="space-y-2">
            <div className="overflow-x-auto bg-card rounded-xl">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="p-3">Order</th><th className="p-3">Сума</th><th className="p-3">Статус</th><th className="p-3">Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b last:border-0">
                      <td className="p-3 font-mono text-xs">{o.order_reference}</td>
                      <td className="p-3">{o.amount} {o.currency}</td>
                      <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${o.status === "paid" ? "bg-primary/20 text-primary" : "bg-muted"}`}>{o.status}</span></td>
                      <td className="p-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("uk-UA")}</td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Немає платежів</td></tr>}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground mr-1">Сортувати за роллю:</span>
              {(() => {
                const adminCount = users.filter((u) => (rolesByUser[u.id] ?? []).includes("admin")).length;
                const organizerCount = users.filter((u) => (rolesByUser[u.id] ?? []).includes("organizer")).length;
                const participantCount = users.filter((u) => {
                  const rs = rolesByUser[u.id] ?? [];
                  return rs.length === 0 || rs.includes("participant");
                }).length;
                return ([
                  { v: "all", label: `Усі (${users.length})` },
                  { v: "admin", label: `Адміністратори (${adminCount})` },
                  { v: "organizer", label: `Організатори (${organizerCount})` },
                  { v: "participant", label: `Учасники (${participantCount})` },
                ] as const).map((opt) => (
                <Button
                  key={opt.v}
                  size="sm"
                  variant={roleFilter === opt.v ? "default" : "outline"}
                  onClick={() => { setRoleFilter(opt.v); setUserLimit(50); }}
                >
                  {opt.label}
                </Button>
              ));
              })()}
              <span className="text-sm text-muted-foreground ml-3 mr-1">Сортувати:</span>
              {([
                { v: "newest", label: "Спочатку нові" },
                { v: "oldest", label: "Спочатку старі" },
                { v: "city_asc", label: "Місто A→Я" },
                { v: "city_desc", label: "Місто Я→A" },
                { v: "club_asc", label: "Клуб A→Я" },
                { v: "club_desc", label: "Клуб Я→A" },
              ] as const).map((opt) => (
                <Button
                  key={opt.v}
                  size="sm"
                  variant={userSort === opt.v ? "default" : "outline"}
                  onClick={() => { setUserSort(opt.v); setUserLimit(50); }}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground mr-1">Місто:</span>
              <Select value={cityFilter} onValueChange={(v) => { setCityFilter(v); setUserLimit(50); }}>
                <SelectTrigger className="h-8 w-[200px]"><SelectValue placeholder="Усі міста" /></SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">Усі міста ({users.filter(u => norm(u.city) !== "").length})</SelectItem>
                  {cityOptions.map((c) => (
                    <SelectItem key={c.key} value={c.key}>
                      {c.label} ({users.filter(u => normLower(u.city) === c.key).length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {cityFilter !== "all" && (
                <Button size="sm" variant="ghost" onClick={() => setCityFilter("all")}>Скинути</Button>
              )}
              <span className="text-sm text-muted-foreground ml-3 mr-1">Клуб:</span>
              <Select value={clubFilter} onValueChange={(v) => { setClubFilter(v); setUserLimit(50); }}>
                <SelectTrigger className="h-8 w-[200px]"><SelectValue placeholder="Усі клуби" /></SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">Усі клуби ({users.filter(u => norm(u.club) !== "").length})</SelectItem>
                  {clubOptions.map((c) => (
                    <SelectItem key={c.key} value={c.key}>
                      {c.label} ({users.filter(u => normLower(u.club) === c.key).length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {clubFilter !== "all" && (
                <Button size="sm" variant="ghost" onClick={() => setClubFilter("all")}>Скинути</Button>
              )}
            </div>
            <div className="overflow-x-auto bg-card rounded-xl">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="p-3">Email</th>
                    <th className="p-3">Телефон</th>
                    <th className="p-3">Ім'я</th>
                    <th className="p-3">Місто</th>
                    <th className="p-3">Клуб</th>
                    <th className="p-3">Дата реєстрації</th>
                    <th className="p-3">Ролі</th>
                    <th className="p-3 text-right">Керування ролями</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map((u) => {
                    const userRoles = rolesByUser[u.id] ?? [];
                    const hasOrganizer = userRoles.includes("organizer");
                    const hasAdmin = userRoles.includes("admin");
                    const isSelf = u.id === user.id;
                    return (
                      <tr key={u.id} className="border-b last:border-0 align-top">
                        <td className="p-3">{u.email}</td>
                        <td className="p-3 whitespace-nowrap">{(u as any).phone ?? "—"}</td>
                        <td className="p-3">{u.full_name ?? "—"}</td>
                        <td className="p-3">{u.city ?? "—"}</td>
                        <td className="p-3">{u.club ?? "—"}</td>
                        <td className="p-3 whitespace-nowrap text-muted-foreground">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {userRoles.length === 0 ? (
                              <span className="text-xs text-muted-foreground">Учасник</span>
                            ) : (
                              userRoles.map((r) => (
                                <span
                                  key={r}
                                  className={`px-2 py-0.5 rounded text-xs ${
                                    r === "admin"
                                      ? "bg-destructive/20 text-destructive"
                                      : r === "organizer"
                                      ? "bg-primary/20 text-primary"
                                      : "bg-muted"
                                  }`}
                                >
                                  {ROLE_LABEL[r]}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-2 justify-end">
                            {hasOrganizer ? (
                              <Button size="sm" variant="outline" onClick={() => revokeRole(u.id, "organizer")}>
                                − Організатор
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => grantRole(u.id, "organizer")}>
                                + Організатор
                              </Button>
                            )}
                            {hasAdmin ? (
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={isSelf}
                                title={isSelf ? "Не можна зняти роль із себе" : undefined}
                                onClick={() => revokeRole(u.id, "admin")}
                              >
                                − Адмін
                              </Button>
                            ) : (
                              <Button size="sm" onClick={() => grantRole(u.id, "admin")}>
                                + Адмін
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={isSelf || busy}
                                  title={isSelf ? "Не можна видалити самого себе" : "Видалити користувача"}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Видалити користувача?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Користувач <strong>{u.email}</strong> буде остаточно видалений разом із профілем та ролями. Цю дію не можна скасувати.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Скасувати</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteUser(u.id)}>
                                    Видалити
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {visibleUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-muted-foreground">
                        Немає користувачів
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Показано {visibleUsers.length} з {filteredUsers.length}</span>
              {visibleUsers.length < filteredUsers.length && (
                <Button variant="outline" size="sm" onClick={() => setUserLimit((n) => n + 50)}>
                  Завантажити ще 50
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="clubs" className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={clubSearch}
                  onChange={(e) => setClubSearch(e.target.value)}
                  placeholder="Пошук за назвою"
                  className="pl-9 h-9 w-[240px]"
                />
              </div>
              <span className="text-sm text-muted-foreground ml-3 mr-1">Місто:</span>
              <Select value={clubCityFilter} onValueChange={setClubCityFilter}>
                <SelectTrigger className="h-8 w-[200px]"><SelectValue placeholder="Усі міста" /></SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">Усі міста</SelectItem>
                  {clubCityOptions.map((c) => (
                    <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {clubCityFilter !== "all" && (
                <Button size="sm" variant="ghost" onClick={() => setClubCityFilter("all")}>Скинути</Button>
              )}
              <span className="text-sm text-muted-foreground ml-3 mr-1">Тип:</span>
              <Select value={clubActivityFilter} onValueChange={setClubActivityFilter}>
                <SelectTrigger className="h-8 w-[200px]"><SelectValue placeholder="Усі види" /></SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">Усі види</SelectItem>
                  {CLUB_ACTIVITY_TYPES.map((a) => (
                    <SelectItem key={a} value={a}>{CLUB_ACTIVITY_LABELS.uk[a]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {clubActivityFilter !== "all" && (
                <Button size="sm" variant="ghost" onClick={() => setClubActivityFilter("all")}>Скинути</Button>
              )}
            </div>

            <div className="overflow-x-auto bg-card rounded-xl">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="p-3">Лого</th>
                    <th className="p-3">Назва</th>
                    <th className="p-3">Місто</th>
                    <th className="p-3">Типи</th>
                    <th className="p-3">Власник</th>
                    <th className="p-3">Створено</th>
                    <th className="p-3 text-right">Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClubs.map((c) => (
                    <tr key={c.id} className="border-b last:border-0 align-top">
                      <td className="p-3">
                        {c.logo_url ? (
                          <img src={c.logo_url} alt="" className="h-10 w-10 rounded object-cover border border-border" />
                        ) : (
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-lg">🏃</div>
                        )}
                      </td>
                      <td className="p-3 font-medium">{c.name}</td>
                      <td className="p-3 text-muted-foreground">{c.city ?? "—"}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1 max-w-[260px]">
                          {(c.activity_types ?? []).map((a) => (
                            <Badge key={a} variant="secondary" className="text-xs">
                              {CLUB_ACTIVITY_LABELS.uk[a]}
                            </Badge>
                          ))}
                          {(c.activity_types ?? []).length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                      </td>
                      <td className="p-3 text-xs">
                        <div className="font-medium">{c.owner_name ?? "—"}</div>
                        <div className="text-muted-foreground">{c.owner_email ?? "—"}</div>
                      </td>
                      <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString("uk-UA")}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2 justify-end">
                          <Button asChild size="sm" variant="outline" title="Перегляд">
                            <Link to={`/clubs/${c.slug ?? c.id}`} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/clubs/edit?id=${c.id}`}><Edit className="h-4 w-4" /> Редагувати</Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" title="Видалити клуб">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Видалити клуб?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Клуб <strong>{c.name}</strong> буде остаточно видалений. Цю дію не можна скасувати.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Скасувати</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteClub(c.id, c.name)}>
                                  Видалити
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredClubs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-muted-foreground">
                        Немає клубів
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="text-sm text-muted-foreground">
              Показано {filteredClubs.length} з {clubs.length}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
