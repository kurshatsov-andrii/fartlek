import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Send, Pin, PinOff, Trash2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { z } from "zod";

interface ChatMessage {
  id: string;
  event_id: string;
  user_id: string;
  content: string;
  is_pinned: boolean;
  pinned_at: string | null;
  created_at: string;
  deleted_at: string | null;
}

interface ProfileMini {
  id: string;
  full_name: string | null;
  email: string;
}

interface Props {
  eventId: string;
  eventOrganizerId: string;
}

const messageSchema = z.string().trim().min(1, "Порожнє повідомлення").max(2000, "Максимум 2000 символів");

export const EventChat = ({ eventId, eventOrganizerId }: Props) => {
  const { user, isAdmin } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileMini>>({});
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [isCoOrganizer, setIsCoOrganizer] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const canManage = !!user && (isAdmin || user.id === eventOrganizerId || isCoOrganizer);

  const markRead = async () => {
    if (!user || !canManage) return;
    await supabase
      .from("event_chat_reads")
      .upsert(
        { user_id: user.id, event_id: eventId, last_read_at: new Date().toISOString() },
        { onConflict: "user_id,event_id" }
      );
  };

  const loadProfiles = async (userIds: string[]) => {
    const missing = userIds.filter((id) => !profiles[id]);
    if (missing.length === 0) return;
    const { data } = await supabase.from("profiles").select("id, full_name, email").in("id", missing);
    if (data) {
      setProfiles((prev) => {
        const next = { ...prev };
        for (const p of data) next[p.id] = p as ProfileMini;
        return next;
      });
    }
  };

  const refresh = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("event_chat_messages")
      .select("*")
      .eq("event_id", eventId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const msgs = (data ?? []) as ChatMessage[];
    setMessages(msgs);
    await loadProfiles(Array.from(new Set(msgs.map((m) => m.user_id))));
    setLoading(false);
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    });
  };

  useEffect(() => {
    refresh();
    // Check co-organizer status
    if (user) {
      supabase
        .from("event_co_organizers")
        .select("id")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => setIsCoOrganizer(!!data));
    }

    const channel = supabase
      .channel(`event-chat-${eventId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_chat_messages", filter: `event_id=eq.${eventId}` },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const m = payload.new as ChatMessage;
            if (m.deleted_at) return;
            await loadProfiles([m.user_id]);
            setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
            requestAnimationFrame(() => {
              listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
            });
          } else if (payload.eventType === "UPDATE") {
            const m = payload.new as ChatMessage;
            setMessages((prev) =>
              m.deleted_at ? prev.filter((x) => x.id !== m.id) : prev.map((x) => (x.id === m.id ? m : x))
            );
          } else if (payload.eventType === "DELETE") {
            const old = payload.old as { id: string };
            setMessages((prev) => prev.filter((x) => x.id !== old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, user?.id]);

  const send = async () => {
    if (!user) return;
    const parsed = messageSchema.safeParse(text);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setSending(true);
    const { error } = await supabase.from("event_chat_messages").insert({
      event_id: eventId,
      user_id: user.id,
      content: parsed.data,
    });
    setSending(false);
    if (error) toast.error(error.message);
    else setText("");
  };

  const togglePin = async (m: ChatMessage) => {
    if (!user) return;
    const { error } = await supabase
      .from("event_chat_messages")
      .update({
        is_pinned: !m.is_pinned,
        pinned_at: !m.is_pinned ? new Date().toISOString() : null,
        pinned_by: !m.is_pinned ? user.id : null,
      })
      .eq("id", m.id);
    if (error) toast.error(error.message);
  };

  const remove = async (m: ChatMessage) => {
    if (!user) return;
    if (!confirm("Видалити це повідомлення?")) return;
    // Soft delete so realtime UPDATE removes it for everyone
    const { error } = await supabase
      .from("event_chat_messages")
      .update({ deleted_at: new Date().toISOString(), deleted_by: user.id })
      .eq("id", m.id);
    if (error) toast.error(error.message);
  };

  const pinned = messages.filter((m) => m.is_pinned);
  const regular = messages.filter((m) => !m.is_pinned);

  const initials = (p?: ProfileMini) =>
    (p?.full_name || p?.email || "?")
      .split(" ")
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const renderMsg = (m: ChatMessage) => {
    const p = profiles[m.user_id];
    const name = p?.full_name?.trim() || p?.email?.split("@")[0] || "Користувач";
    const isOrganizer = m.user_id === eventOrganizerId;
    const isOwn = user?.id === m.user_id;
    const canDelete = isOwn || canManage;
    return (
      <div key={m.id} className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="text-xs">{initials(p)}</AvatarFallback>
        </Avatar>
        <div className={`flex-1 min-w-0 ${isOwn ? "text-right" : ""}`}>
          <div className={`flex items-center gap-2 flex-wrap text-xs text-muted-foreground ${isOwn ? "justify-end" : ""}`}>
            <span className="font-semibold text-foreground">{name}</span>
            {isOrganizer && (
              <span className="px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-semibold uppercase tracking-wider text-[10px]">
                Організатор
              </span>
            )}
            <span>{new Date(m.created_at).toLocaleString("uk-UA", { dateStyle: "short", timeStyle: "short" })}</span>
            {m.is_pinned && <Pin className="h-3 w-3" />}
          </div>
          <div
            className={`mt-1 inline-block max-w-full text-left rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${
              isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}
          >
            {m.content}
          </div>
          {(canManage || canDelete) && (
            <div className={`flex gap-1 mt-1 ${isOwn ? "justify-end" : ""}`}>
              {canManage && (
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => togglePin(m)}>
                  {m.is_pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                  onClick={() => remove(m)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="bg-card rounded-2xl shadow-card p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h2 className="font-display text-2xl font-bold">Чат події</h2>
        <span className="text-sm text-muted-foreground ml-auto">{messages.length} повідомл.</span>
      </div>

      {pinned.length > 0 && (
        <div className="mb-4 space-y-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Pin className="h-3 w-3" /> Закріплені
          </div>
          {pinned.map(renderMsg)}
        </div>
      )}

      <div ref={listRef} className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : regular.length === 0 && pinned.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">
            Поки що повідомлень немає. Будьте першим!
          </p>
        ) : (
          regular.map(renderMsg)
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        {user ? (
          <div className="flex gap-2 items-end">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Напишіть повідомлення... (Ctrl/⌘+Enter — надіслати)"
              maxLength={2000}
              rows={2}
              className="resize-none"
            />
            <Button onClick={send} disabled={sending || !text.trim()} size="lg">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground">
            <Link to="/auth" className="text-primary hover:underline font-semibold">
              Увійдіть
            </Link>{" "}
            щоб приєднатися до обговорення
          </div>
        )}
      </div>
    </section>
  );
};
