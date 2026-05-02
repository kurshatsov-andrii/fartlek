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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const text = await req.text();
    const params = new URLSearchParams(text);
    const dataB64 = params.get("data") ?? "";
    const signature = params.get("signature") ?? "";

    if (!dataB64 || !signature) {
      return new Response("missing data/signature", { status: 400, headers: corsHeaders });
    }

    const payload = JSON.parse(atob(dataB64));
    console.log("LiqPay callback:", payload);

    const orderRef = payload.order_id;
    if (!orderRef) {
      return new Response("missing order_id", { status: 400, headers: corsHeaders });
    }

    const { data: order } = await supabase
      .from("liqpay_orders")
      .select("*, registrations(event_id)")
      .eq("order_reference", orderRef)
      .maybeSingle();

    if (!order) {
      console.error("Order not found:", orderRef);
      return new Response("order not found", { status: 404, headers: corsHeaders });
    }

    // @ts-ignore
    const eventId = order.registrations?.event_id;
    if (!eventId) {
      return new Response("event not found", { status: 404, headers: corsHeaders });
    }

    const { data: settings } = await supabase
      .from("event_payment_settings")
      .select("liqpay_private_key")
      .eq("event_id", eventId)
      .maybeSingle();

    const PRIVATE_KEY = settings?.liqpay_private_key;
    if (!PRIVATE_KEY) {
      console.error("No LiqPay key configured for event", eventId);
      return new Response("merchant not configured", { status: 400, headers: corsHeaders });
    }

    const expected = sign(PRIVATE_KEY, dataB64);
    if (expected !== signature) {
      console.error("Signature mismatch", { expected, got: signature });
      return new Response("invalid signature", { status: 400, headers: corsHeaders });
    }

    const status = String(payload.status ?? "");
    const isPaid = status === "success" || status === "sandbox" || status === "wait_compensation";
    const newStatus = isPaid ? "paid" : status;

    await supabase.from("liqpay_orders").update({
      status: newStatus,
      raw_callback: payload,
    }).eq("id", order.id);

    if (isPaid) {
      await supabase.from("registrations").update({
        payment_status: "paid",
      }).eq("id", order.registration_id);
    }

    return new Response("OK", { headers: corsHeaders });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
