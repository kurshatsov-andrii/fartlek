// Inbound webhook for Telegram channel posts from @fartlekua.
// Bot must be admin of the channel. Telegram sends channel_post / edited_channel_post updates.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { parseStartContent, generateStartSeo } from "../_shared/parse-start.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-telegram-bot-api-secret-token",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");

async function deriveSecret(key: string): Promise<string> {
  const data = new TextEncoder().encode(`telegram-starts-webhook:${key}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function safeEqual(a: string | null, b: string): boolean {
  if (!a || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Parse a Ukrainian/Russian post: first line = title, find date, first URL = register
function parsePost(text: string, entities: any[] | undefined) {
  const firstLine = (text.split(/\r?\n/).find((l) => l.trim().length > 0) || "").trim().slice(0, 200);

  // First URL via entities (handles text_link) or regex
  let registerUrl: string | null = null;
  if (entities) {
    for (const e of entities) {
      if (e.type === "text_link" && e.url) { registerUrl = e.url; break; }
      if (e.type === "url") {
        registerUrl = text.substring(e.offset, e.offset + e.length);
        break;
      }
    }
  }
  if (!registerUrl) {
    const m = text.match(/https?:\/\/[^\s)]+/);
    if (m) registerUrl = m[0];
  }
  // Ignore the channel's own t.me links and Telegraph file/image links as register URL
  if (registerUrl && /t\.me\/fartlekua/i.test(registerUrl)) registerUrl = null;
  if (registerUrl && /telegra(ph|m)\.(controller\.bot|ph)\/file/i.test(registerUrl)) registerUrl = null;

  // Find date: dd.mm.yyyy | dd/mm/yyyy | dd.mm (assume next occurrence in current year)
  let eventDate: string | null = null;
  const months: Record<string, number> = {
    "січня":1,"лютого":2,"березня":3,"квітня":4,"травня":5,"червня":6,
    "липня":7,"серпня":8,"вересня":9,"жовтня":10,"листопада":11,"грудня":12,
    "января":1,"февраля":2,"марта":3,"апреля":4,"мая":5,"июня":6,
    "июля":7,"августа":8,"сентября":9,"октября":10,"ноября":11,"декабря":12,
  };
  const lower = text.toLowerCase();
  const m1 = text.match(/(\d{1,2})[.\/](\d{1,2})[.\/](\d{2,4})/);
  const m2 = lower.match(/(\d{1,2})\s+(січня|лютого|березня|квітня|травня|червня|липня|серпня|вересня|жовтня|листопада|грудня|января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)(?:\s+(\d{4}))?/);
  const today = new Date();
  if (m1) {
    const d = parseInt(m1[1], 10);
    const mo = parseInt(m1[2], 10);
    let y = parseInt(m1[3], 10);
    if (y < 100) y += 2000;
    if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12) {
      eventDate = `${y.toString().padStart(4,"0")}-${mo.toString().padStart(2,"0")}-${d.toString().padStart(2,"0")}`;
    }
  } else if (m2) {
    const d = parseInt(m2[1], 10);
    const mo = months[m2[2]];
    let y = m2[3] ? parseInt(m2[3], 10) : today.getFullYear();
    const candidate = new Date(y, mo - 1, d);
    if (candidate < today) y += 1;
    eventDate = `${y}-${mo.toString().padStart(2,"0")}-${d.toString().padStart(2,"0")}`;
  }

  return { title: firstLine, registerUrl, eventDate };
}

async function downloadAndStorePhoto(supabase: any, fileId: string, slugBase: string): Promise<string | null> {
  if (!LOVABLE_API_KEY || !TELEGRAM_API_KEY) return null;
  try {
    const r = await fetch(`${GATEWAY_URL}/getFile`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TELEGRAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ file_id: fileId }),
    });
    const data = await r.json();
    if (!r.ok || !data?.result?.file_path) return null;
    const dl = await fetch(`${GATEWAY_URL}/file/${data.result.file_path}`, {
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TELEGRAM_API_KEY,
      },
    });
    if (!dl.ok) return null;
    const buf = new Uint8Array(await dl.arrayBuffer());
    const ext = data.result.file_path.split(".").pop() || "jpg";
    const path = `telegram-starts/${slugBase}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("event-images").upload(path, buf, {
      contentType: ext === "png" ? "image/png" : "image/jpeg",
      upsert: true,
    });
    if (error) { console.error("upload error", error); return null; }
    const { data: pub } = supabase.storage.from("event-images").getPublicUrl(path);
    return pub.publicUrl;
  } catch (e) {
    console.error("photo download error", e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (TELEGRAM_API_KEY) {
    const expected = await deriveSecret(TELEGRAM_API_KEY);
    const got = req.headers.get("x-telegram-bot-api-secret-token");
    if (!safeEqual(got, expected)) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }
  }

  let update: any;
  try { update = await req.json(); } catch { return new Response("Bad JSON", { status: 400, headers: corsHeaders }); }

  const post = update.channel_post || update.edited_channel_post;
  if (!post) {
    return new Response(JSON.stringify({ ok: true, ignored: "not a channel post" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  const chatId = post.chat?.id as number | undefined;
  const messageId = post.message_id as number | undefined;
  const text = (post.caption || post.text || "") as string;
  const entities = post.caption_entities || post.entities;
  const mediaGroupId = post.media_group_id || null;

  // Skip channels that aren't @fartlekua (defense in depth)
  const username = (post.chat?.username || "").toLowerCase();
  if (username && username !== "fartlekua") {
    return new Response(JSON.stringify({ ok: true, ignored: "wrong channel", username }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const parsed = parsePost(text, entities);
  const extra = parseStartContent(text);

  // Pick largest photo
  let imageUrl: string | null = null;
  const photoArr = post.photo as any[] | undefined;
  if (photoArr && photoArr.length > 0) {
    const largest = photoArr[photoArr.length - 1];
    const slugBase = (parsed.title || "post").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "post";
    imageUrl = await downloadAndStorePhoto(supabase, largest.file_id, slugBase);
  }

  // For edited posts, update existing row
  if (update.edited_channel_post && chatId && messageId) {
    const { data: existing } = await supabase
      .from("telegram_starts")
      .select("id, image_url")
      .eq("telegram_chat_id", chatId)
      .eq("telegram_message_id", messageId)
      .maybeSingle();
    if (existing) {
      const seo = generateStartSeo({
        title: parsed.title || "",
        event_date: parsed.eventDate,
        city: extra.city,
        distances_km: extra.distances_km,
        organizer_name: extra.organizer_name,
      });
      const patch: any = {
        title: parsed.title || "",
        description: text,
        register_url: parsed.registerUrl,
        event_date: parsed.eventDate,
        raw_payload: post,
        sport_types: extra.sport_types,
        distances_km: extra.distances_km,
        city: extra.city,
        region: extra.region,
        organizer_name: extra.organizer_name,
        is_paid: extra.is_paid,
        seo_title: seo.seo_title,
        seo_description: seo.seo_description,
      };
      if (imageUrl) patch.image_url = imageUrl;
      await supabase.from("telegram_starts").update(patch).eq("id", existing.id);
      return new Response(JSON.stringify({ ok: true, updated: existing.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // Insert as draft. Admin will publish (or cron will if it has date+url+title and date >= 2026-07-01).
  const seoNew = generateStartSeo({
    title: parsed.title || "",
    event_date: parsed.eventDate,
    city: extra.city,
    distances_km: extra.distances_km,
    organizer_name: extra.organizer_name,
  });
  const { data: inserted, error } = await supabase
    .from("telegram_starts")
    .insert({
      telegram_chat_id: chatId,
      telegram_message_id: messageId,
      telegram_media_group_id: mediaGroupId,
      title: parsed.title || "",
      description: text,
      image_url: imageUrl,
      register_url: parsed.registerUrl,
      event_date: parsed.eventDate,
      raw_payload: post,
      status: "draft",
      sport_types: extra.sport_types,
      distances_km: extra.distances_km,
      city: extra.city,
      region: extra.region,
      organizer_name: extra.organizer_name,
      is_paid: extra.is_paid,
      seo_title: seoNew.seo_title,
      seo_description: seoNew.seo_description,
    })
    .select("id")
    .single();

  if (error) {
    // Unique conflict means we already stored this update; ignore
    if (String(error.message).includes("duplicate")) {
      return new Response(JSON.stringify({ ok: true, duplicate: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.error("insert error", error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, id: inserted.id }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
