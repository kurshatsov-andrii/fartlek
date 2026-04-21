import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SECRET = Deno.env.get("WAYFORPAY_SECRET_KEY")!;

function sign(fields: (string | number)[]) {
  return createHmac("md5", SECRET).update(fields.join(";")).digest("hex");
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

    const expected = sign([
      merchantAccount, orderReference, amount, currency,
      authCode ?? "", cardPan ?? "", transactionStatus, reasonCode,
    ]);

    if (expected !== merchantSignature) {
      console.error("Signature mismatch", { expected, got: merchantSignature });
      return new Response("invalid signature", { status: 400, headers: corsHeaders });
    }

    const { data: order } = await supabase
      .from("wayforpay_orders")
      .select("*")
      .eq("order_reference", orderReference)
      .maybeSingle();

    if (order) {
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
    }

    const time = Math.floor(Date.now() / 1000);
    const responseSig = sign([orderReference, "accept", time]);

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
