import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createHash } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function sign(privateKey: string, dataB64: string) {
  return createHash("sha1").update(privateKey + dataB64 + privateKey).digest("base64");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { registration_id } = await req.json();
    if (!registration_id) return new Response(JSON.stringify({ error: "registration_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: reg, error: regErr } = await supabase
      .from("registrations")
      .select("id, user_id, event_id, distance_id, payment_status, events(title), distances(distance_km, name, price)")
      .eq("id", registration_id)
      .maybeSingle();
    if (regErr || !reg) return new Response(JSON.stringify({ error: "registration not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (reg.user_id !== user.id) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (reg.payment_status === "paid") return new Response(JSON.stringify({ error: "already paid" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: settings } = await supabase
      .from("event_payment_settings")
      .select("liqpay_public_key, liqpay_private_key")
      .eq("event_id", reg.event_id)
      .maybeSingle();

    const PUBLIC_KEY = settings?.liqpay_public_key;
    const PRIVATE_KEY = settings?.liqpay_private_key;

    if (!PUBLIC_KEY || !PRIVATE_KEY) {
      return new Response(JSON.stringify({ error: "Організатор не налаштував реквізити LiqPay для цієї події" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // @ts-ignore
    const amount = Number(reg.distances?.price ?? 0);
    if (amount <= 0) return new Response(JSON.stringify({ error: "free registration" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const orderRef = `reg_${reg.id}_${Date.now()}`;
    // @ts-ignore
    const description = `${reg.events?.title} — ${reg.distances?.distance_km}km`;

    const projectId = Deno.env.get("SUPABASE_URL")!.match(/https:\/\/(.+?)\./)?.[1];
    const serverUrl = `https://${projectId}.supabase.co/functions/v1/liqpay-callback`;
    const origin = req.headers.get("origin") ?? "";
    const resultUrl = `${origin}/payment/success?order=${orderRef}`;

    const payload = {
      public_key: PUBLIC_KEY,
      version: "3",
      action: "pay",
      amount,
      currency: "UAH",
      description,
      order_id: orderRef,
      language: "uk",
      server_url: serverUrl,
      result_url: resultUrl,
    };

    const dataB64 = btoa(JSON.stringify(payload));
    const signature = sign(PRIVATE_KEY, dataB64);

    await supabase.from("liqpay_orders").insert({
      order_reference: orderRef,
      registration_id: reg.id,
      user_id: user.id,
      amount,
      currency: "UAH",
      status: "created",
    });

    return new Response(JSON.stringify({
      checkout: {
        action: "https://www.liqpay.ua/api/3/checkout",
        data: dataB64,
        signature,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
