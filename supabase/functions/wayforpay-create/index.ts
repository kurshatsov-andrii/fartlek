import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MERCHANT = Deno.env.get("WAYFORPAY_MERCHANT_LOGIN")!;
const SECRET = Deno.env.get("WAYFORPAY_SECRET_KEY")!;
const DOMAIN = Deno.env.get("WAYFORPAY_MERCHANT_DOMAIN")!;

function sign(fields: (string | number)[]) {
  return createHmac("md5", SECRET).update(fields.join(";")).digest("hex");
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

    // @ts-ignore embedded
    const amount = Number(reg.distances?.price ?? 0);
    if (amount <= 0) return new Response(JSON.stringify({ error: "free registration" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const orderRef = `reg_${reg.id}_${Date.now()}`;
    // @ts-ignore
    const productName = `${reg.events?.title} — ${reg.distances?.distance_km}km`;
    const productCount = 1;
    const productPrice = amount;
    const orderDate = Math.floor(Date.now() / 1000);
    const currency = "UAH";

    const signature = sign([
      MERCHANT, DOMAIN, orderRef, orderDate, amount, currency,
      productName, productCount, productPrice,
    ]);

    await supabase.from("wayforpay_orders").insert({
      order_reference: orderRef,
      registration_id: reg.id,
      user_id: user.id,
      amount,
      currency,
      status: "created",
    });

    const projectId = Deno.env.get("SUPABASE_URL")!.match(/https:\/\/(.+?)\./)?.[1];
    const serviceUrl = `https://${projectId}.supabase.co/functions/v1/wayforpay-callback`;
    const returnUrl = `https://${DOMAIN}/payment/success?order=${orderRef}`;

    return new Response(JSON.stringify({
      checkout: {
        merchantAccount: MERCHANT,
        merchantDomainName: DOMAIN,
        merchantSignature: signature,
        orderReference: orderRef,
        orderDate,
        amount,
        currency,
        productName: [productName],
        productCount: [productCount],
        productPrice: [productPrice],
        serviceUrl,
        returnUrl,
        language: "UA",
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
