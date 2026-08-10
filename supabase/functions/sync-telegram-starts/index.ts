// Daily sync at 13:00 Kyiv. Two jobs:
// 1) Auto-publish DRAFT starts that have title, register_url, event_date and date >= 2026-07-01.
// 2) Hide (status='hidden') any PUBLISHED starts whose event_date is in the past.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const today = new Date().toISOString().slice(0, 10);

  // 1) Auto-publish ready drafts
  const { data: pubData, error: pubErr } = await supabase
    .from("telegram_starts")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("status", "draft")
    .not("title", "is", null)
    .not("register_url", "is", null)
    .not("event_date", "is", null)
    .gte("event_date", "2026-07-01")
    .neq("title", "")
    .select("id");

  // 2) Past published starts stay published — they are shown in the "Completed" section
  const hideData: { id: string }[] = [];
  const hideErr: { message?: string } | null = null;


  return new Response(JSON.stringify({
    ok: true,
    published: pubData?.length ?? 0,
    hidden: hideData?.length ?? 0,
    errors: { pubErr: pubErr?.message, hideErr: hideErr?.message },
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
