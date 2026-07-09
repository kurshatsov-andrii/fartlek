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

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
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

    // Беремо реквізити організатора з event_payment_settings
    const { data: settings } = await supabase
      .from("event_payment_settings")
      .select("wayforpay_merchant_login, wayforpay_secret_key, wayforpay_merchant_domain")
      .eq("event_id", reg.event_id)
      .maybeSingle();

    const MERCHANT = settings?.wayforpay_merchant_login;
    const SECRET = settings?.wayforpay_secret_key;
    // Домен беремо з origin запиту (де користувач натиснув «Сплатити»),
    // з фолбеком на збережене значення для зворотної сумісності.
    const originHeader = req.headers.get("origin") ?? req.headers.get("referer") ?? "";
    let originDomain = "";
    try { originDomain = originHeader ? new URL(originHeader).hostname : ""; } catch { originDomain = ""; }
    const DOMAIN = (settings?.wayforpay_merchant_domain || originDomain || "")
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "")
      .trim();

    if (!MERCHANT || !SECRET || !DOMAIN) {
      return new Response(JSON.stringify({ error: "Організатор не налаштував реквізити WayForPay для цієї події" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // @ts-ignore embedded
    const basePrice = Number(reg.distances?.price ?? 0);

    // Враховуємо знижку від промокоду (якщо застосований до цієї реєстрації)
    const { data: redemptions } = await supabase
      .from("promo_code_redemptions")
      .select("discount_amount")
      .eq("registration_id", reg.id);
    const discount = (redemptions ?? []).reduce(
      (sum, r) => sum + Number(r.discount_amount ?? 0),
      0,
    );
    const amount = Math.max(Number((basePrice - discount).toFixed(2)), 0);

    if (amount <= 0) return new Response(JSON.stringify({ error: "free registration" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const orderRef = `reg_${reg.id}_${Date.now()}`;
    // @ts-ignore
    const productName = `${reg.events?.title} — ${reg.distances?.distance_km}km`;
    const productCount = 1;
    const productPrice = amount;
    const orderDate = Math.floor(Date.now() / 1000);
    const currency = "UAH";

    const signature = sign(SECRET, [
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
    const origin = req.headers.get("origin") ?? `https://${DOMAIN}`;
    const returnUrl = `${origin}/payment/success?order=${orderRef}`;

    return new Response(JSON.stringify({
      checkout: {
        merchantAccount: MERCHANT,
        merchantAuthType: "simpleSignature",
        merchantDomainName: DOMAIN,
        merchantTransactionType: "AUTO",
        merchantTransactionSecureType: "AUTO",
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
