import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function sign(secret: string, fields: (string | number)[]) {
  return createHmac("md5", secret).update(fields.join(";")).digest("hex");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const text = await req.text();
    let payload: any;
    try { payload = JSON.parse(text); }
    catch {
      const params = new URLSearchParams(text);
      payload = JSON.parse(params.get("data") ?? "{}");
    }

    console.log("WFP callback:", payload);

    const {
      merchantAccount, orderReference, amount, currency,
      authCode, cardPan, transactionStatus, reasonCode, merchantSignature,
    } = payload;

    if (!orderReference) {
      return new Response("missing orderReference", { status: 400, headers: corsHeaders });
    }

    // Знаходимо order та через нього — реєстрацію та подію
    const { data: order } = await supabase
      .from("wayforpay_orders")
      .select("*, registrations(event_id)")
      .eq("order_reference", orderReference)
      .maybeSingle();

    if (!order) {
      console.error("Order not found:", orderReference);
      return new Response("order not found", { status: 404, headers: corsHeaders });
    }

    // @ts-ignore embedded
    const eventId = order.registrations?.event_id;
    if (!eventId) {
      return new Response("event not found", { status: 404, headers: corsHeaders });
    }

    // Беремо секрет цього організатора
    const { data: settings } = await supabase
      .from("event_payment_settings")
      .select("wayforpay_secret_key")
      .eq("event_id", eventId)
      .maybeSingle();

    const SECRET = settings?.wayforpay_secret_key;
    if (!SECRET) {
      console.error("No secret configured for event", eventId);
      return new Response("merchant not configured", { status: 400, headers: corsHeaders });
    }

    const expected = sign(SECRET, [
      merchantAccount, orderReference, amount, currency,
      authCode ?? "", cardPan ?? "", transactionStatus, reasonCode,
    ]);

    if (expected !== merchantSignature) {
      console.error("Signature mismatch", { expected, got: merchantSignature });
      return new Response("invalid signature", { status: 400, headers: corsHeaders });
    }

    const newStatus = transactionStatus === "Approved" ? "paid" : "declined";
    await supabase.from("wayforpay_orders").update({
      status: newStatus,
      raw_callback: payload,
    }).eq("id", order.id);

    if (transactionStatus === "Approved") {
      await supabase.from("registrations").update({
        payment_status: "paid",
      }).eq("id", order.registration_id);
    }

    const time = Math.floor(Date.now() / 1000);
    const responseSig = sign(SECRET, [orderReference, "accept", time]);

    return new Response(JSON.stringify({
      orderReference,
      status: "accept",
      time,
      signature: responseSig,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
