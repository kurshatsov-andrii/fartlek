import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Send, Pin, PinOff, Trash2, MessageCircle, Pencil, X, Check, Reply, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { z } from "zod";
import { linkifyText } from "@/lib/linkify";

interface ChatMessage {
  id: string;
  event_id: string;
  user_id: string;
  content: string;
  is_pinned: boolean;
  pinned_at: string | null;
  created_at: string;
  deleted_at: string | null;
  edited_at: string | null;
  reply_to_id: string | null;
}

interface ChatReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
}

interface ProfileMini {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

interface Props {
  eventId: string;
  eventOrganizerId: string;
}

const messageSchema = z.string().trim().min(1, "Порожнє повідомлення").max(2000, "Максимум 2000 символів");
const QUICK_EMOJIS = ["👍", "❤️", "🔥", "😂", "😮", "🎉", "👏", "🙏"];

export const EventChat = ({ eventId, eventOrganizerId }: Props) => {
  const { user, isAdmin } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<ChatReaction[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileMini>>({});
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [isCoOrganizer, setIsCoOrganizer] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const canManage = !!user && (isAdmin || user.id === eventOrganizerId || isCoOrganizer);

  const messageById = useMemo(() => {
    const map: Record<string, ChatMessage> = {};
    for (const m of messages) map[m.id] = m;
    return map;
  }, [messages]);

  const reactionsByMessage = useMemo(() => {
    const map: Record<string, ChatReaction[]> = {};
    for (const r of reactions) {
      (map[r.message_id] ||= []).push(r);
    }
    return map;
  }, [reactions]);

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
    const { data } = await supabase.rpc("get_chat_authors", { _user_ids: missing });
    if (data) {
      setProfiles((prev) => {
        const next = { ...prev };
        for (const p of data as any[]) next[p.id] = p as ProfileMini;
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

    if (msgs.length > 0) {
      const ids = msgs.map((m) => m.id);
      const { data: rx } = await supabase
        .from("event_chat_reactions")
        .select("*")
        .in("message_id", ids);
      setReactions((rx ?? []) as ChatReaction[]);
    } else {
      setReactions([]);
    }

    setLoading(false);
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    });
  };

  useEffect(() => {
    refresh();
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
            markRead();
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_chat_reactions" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const r = payload.new as ChatReaction;
            setReactions((prev) => (prev.some((x) => x.id === r.id) ? prev : [...prev, r]));
          } else if (payload.eventType === "DELETE") {
            const old = payload.old as { id: string };
            setReactions((prev) => prev.filter((x) => x.id !== old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, user?.id]);

  useEffect(() => {
    if (canManage && !loading) markRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage, loading, messages.length]);

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
      reply_to_id: replyTo?.id ?? null,
    });
    setSending(false);
    if (error) toast.error(error.message);
    else {
      setText("");
      setReplyTo(null);
    }
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
    const { error } = await supabase
      .from("event_chat_messages")
      .update({ deleted_at: new Date().toISOString(), deleted_by: user.id })
      .eq("id", m.id);
    if (error) toast.error(error.message);
  };

  const startEdit = (m: ChatMessage) => {
    setEditingId(m.id);
    setEditText(m.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const saveEdit = async (m: ChatMessage) => {
    if (!user) return;
    const parsed = messageSchema.safeParse(editText);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    if (parsed.data === m.content) {
      cancelEdit();
      return;
    }
    setSavingEdit(true);
    const { error } = await supabase
      .from("event_chat_messages")
      .update({ content: parsed.data, edited_at: new Date().toISOString() })
      .eq("id", m.id);
    setSavingEdit(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    cancelEdit();
  };

  const startReply = (m: ChatMessage) => {
    setReplyTo(m);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const toggleReaction = async (m: ChatMessage, emoji: string) => {
    if (!user) {
      toast.error("Увійдіть, щоб реагувати");
      return;
    }
    const mine = reactions.find((r) => r.message_id === m.id && r.user_id === user.id && r.emoji === emoji);
    if (mine) {
      const { error } = await supabase.from("event_chat_reactions").delete().eq("id", mine.id);
      if (error) toast.error(error.message);
    } else {
      const { error } = await supabase.from("event_chat_reactions").insert({
        message_id: m.id,
        user_id: user.id,
        emoji,
      });
      if (error && !error.message.includes("duplicate")) toast.error(error.message);
    }
  };

  const scrollToMessage = (id: string) => {
    const el = document.getElementById(`chat-msg-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-primary", "rounded-lg");
      setTimeout(() => el.classList.remove("ring-2", "ring-primary", "rounded-lg"), 1500);
    }
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

  const AVATAR_COLORS = [
    "bg-rose-500", "bg-pink-500", "bg-fuchsia-500", "bg-purple-500",
    "bg-violet-500", "bg-indigo-500", "bg-blue-500", "bg-sky-500",
    "bg-cyan-500", "bg-teal-500", "bg-emerald-500", "bg-green-500",
    "bg-lime-600", "bg-amber-500", "bg-orange-500", "bg-red-500",
  ];
  const colorFor = (id: string) => {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
  };

  const nameOf = (uid: string) => {
    const p = profiles[uid];
    return p?.full_name?.trim() || p?.email?.split("@")[0] || "Користувач";
  };

  const renderReactions = (m: ChatMessage, isOwn: boolean) => {
    const list = reactionsByMessage[m.id] ?? [];
    if (list.length === 0) return null;
    const grouped: Record<string, ChatReaction[]> = {};
    for (const r of list) (grouped[r.emoji] ||= []).push(r);
    return (
      <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? "justify-end" : ""}`}>
        {Object.entries(grouped).map(([emoji, rs]) => {
          const mine = !!user && rs.some((r) => r.user_id === user.id);
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => toggleReaction(m, emoji)}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border transition-colors ${
                mine
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : "bg-muted border-transparent hover:bg-muted/70"
              }`}
              title={rs.map((r) => nameOf(r.user_id)).join(", ")}
            >
              <span>{emoji}</span>
              <span className="font-semibold">{rs.length}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const renderMsg = (m: ChatMessage) => {
    const p = profiles[m.user_id];
    const name = nameOf(m.user_id);
    const isOrganizer = m.user_id === eventOrganizerId;
    const isOwn = user?.id === m.user_id;
    const canDelete = isOwn || canManage;
    const canEdit = isOwn || canManage;
    const isEditing = editingId === m.id;
    const replied = m.reply_to_id ? messageById[m.reply_to_id] : null;
    return (
      <div key={m.id} id={`chat-msg-${m.id}`} className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
        <Avatar className="h-9 w-9 shrink-0">
          {p?.avatar_url && <AvatarImage src={p.avatar_url} alt={nameOf(m.user_id)} />}
          <AvatarFallback className={`text-xs font-semibold text-white ${colorFor(m.user_id)}`}>
            {initials(p)}
          </AvatarFallback>
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
            {m.edited_at && <span className="italic">(ред.)</span>}
            {m.is_pinned && <Pin className="h-3 w-3" />}
          </div>

          {replied && (
            <button
              type="button"
              onClick={() => scrollToMessage(replied.id)}
              className={`mt-1 block max-w-full text-left rounded-lg border-l-2 border-primary/60 bg-muted/40 hover:bg-muted/70 transition-colors px-2 py-1 text-xs ${
                isOwn ? "ml-auto" : ""
              }`}
            >
              <div className="font-semibold text-primary truncate">↪ {nameOf(replied.user_id)}</div>
              <div className="truncate text-muted-foreground">{replied.content}</div>
            </button>
          )}

          {isEditing ? (
            <div className={`mt-1 ${isOwn ? "flex flex-col items-end" : ""}`}>
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    saveEdit(m);
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    cancelEdit();
                  }
                }}
                maxLength={2000}
                rows={2}
                className="resize-none w-full max-w-xl"
                autoFocus
              />
              <div className="flex gap-1 mt-1">
                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={cancelEdit} disabled={savingEdit}>
                  <X className="h-3 w-3" /> Скасувати
                </Button>
                <Button size="sm" className="h-7 px-2" onClick={() => saveEdit(m)} disabled={savingEdit || !editText.trim()}>
                  {savingEdit ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Зберегти
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={`mt-1 inline-block max-w-full text-left rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              {linkifyText(m.content)}
            </div>
          )}

          {!isEditing && renderReactions(m, isOwn)}

          {!isEditing && (
            <div className={`flex gap-1 mt-1 ${isOwn ? "justify-end" : ""}`}>
              {user && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                      <Smile className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2" align={isOwn ? "end" : "start"}>
                    <div className="flex gap-1">
                      {QUICK_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => toggleReaction(m, emoji)}
                          className="text-lg hover:scale-125 transition-transform px-1"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              {user && (
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => startReply(m)}>
                  <Reply className="h-3 w-3" />
                </Button>
              )}
              {canManage && (
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => togglePin(m)}>
                  {m.is_pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                </Button>
              )}
              {canEdit && (
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => startEdit(m)}>
                  <Pencil className="h-3 w-3" />
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
    <section id="event-chat" className="bg-card rounded-2xl shadow-card p-5 sm:p-6 scroll-mt-20">
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
          <div className="space-y-2">
            {replyTo && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-muted border-l-2 border-primary">
                <Reply className="h-3 w-3 mt-1 text-primary shrink-0" />
                <div className="flex-1 min-w-0 text-xs">
                  <div className="font-semibold text-primary">Відповідь {nameOf(replyTo.user_id)}</div>
                  <div className="truncate text-muted-foreground">{replyTo.content}</div>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setReplyTo(null)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            <div className="flex gap-2 items-end">
              <Textarea
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    send();
                  } else if (e.key === "Escape" && replyTo) {
                    setReplyTo(null);
                  }
                }}
                placeholder={replyTo ? "Ваша відповідь..." : "Напишіть повідомлення... (Ctrl/⌘+Enter — надіслати)"}
                maxLength={2000}
                rows={2}
                className="resize-none"
              />
              <Button onClick={send} disabled={sending || !text.trim()} size="lg">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
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
