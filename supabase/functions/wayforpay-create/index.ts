import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createHmac } from "node:crypto";

function sign(secret: string, fields: (string | number)[]) {
  return createHmac("md5", secret).update(fields.join(";")).digest("hex");
}

function money(value: number) {
  return value.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
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
    // Домен беремо зі збережених реквізитів мерчанта, щоб preview-адреса Lovable
    // не потрапляла в підпис WayForPay. Origin лишається тільки фолбеком.
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
    const amountText = money(amount);

    if (amount <= 0) return new Response(JSON.stringify({ error: "free registration" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const orderRef = `reg_${reg.id}_${Date.now()}`;
    // @ts-ignore
    const productName = `${reg.events?.title} — ${reg.distances?.distance_km}km`;
    const productCount = 1;
    const productPrice = amountText;
    const orderDate = Math.floor(Date.now() / 1000);
    const currency = "UAH";

    const signature = sign(SECRET, [
      MERCHANT, DOMAIN, orderRef, orderDate, amountText, currency,
      productName, productCount, productPrice,
    ]);

    const { error: orderErr } = await supabase.from("wayforpay_orders").insert({
      order_reference: orderRef,
      registration_id: reg.id,
      user_id: user.id,
      amount,
      currency,
      status: "created",
    });
    if (orderErr) {
      console.error("wayforpay order insert failed", orderErr.message);
      return new Response(JSON.stringify({ error: "Не вдалося створити запис замовлення" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const projectId = Deno.env.get("SUPABASE_URL")!.match(/https:\/\/(.+?)\./)?.[1];
    const serviceUrl = `https://${projectId}.supabase.co/functions/v1/wayforpay-callback`;
    const requestOrigin = req.headers.get("origin") ?? `https://${DOMAIN}`;
    const origin = settings?.wayforpay_merchant_domain ? `https://${DOMAIN}` : requestOrigin;
    const returnUrl = `${origin}/payment/success?order=${orderRef}`;

    const checkout = {
      merchantAccount: MERCHANT,
      merchantDomainName: DOMAIN,
      merchantTransactionType: "AUTO",
      merchantTransactionSecureType: "AUTO",
      merchantSignature: signature,
      orderReference: orderRef,
      orderDate,
      amount: amountText,
      currency,
      productName: [productName],
      productCount: [productCount],
      productPrice: [productPrice],
      serviceUrl,
      returnUrl,
      language: "UA",
    };

    const form = new URLSearchParams();
    form.set("merchantAccount", checkout.merchantAccount);
    form.set("merchantDomainName", checkout.merchantDomainName);
    form.set("merchantTransactionType", checkout.merchantTransactionType);
    form.set("merchantTransactionSecureType", checkout.merchantTransactionSecureType);
    form.set("merchantSignature", checkout.merchantSignature);
    form.set("orderReference", checkout.orderReference);
    form.set("orderDate", String(checkout.orderDate));
    form.set("amount", checkout.amount);
    form.set("currency", checkout.currency);
    form.set("serviceUrl", checkout.serviceUrl);
    form.set("returnUrl", checkout.returnUrl);
    form.set("language", checkout.language);
    checkout.productName.forEach((value) => form.append("productName[]", String(value)));
    checkout.productCount.forEach((value) => form.append("productCount[]", String(value)));
    checkout.productPrice.forEach((value) => form.append("productPrice[]", String(value)));

    const wfpResponse = await fetch("https://secure.wayforpay.com/pay?behavior=offline", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: form.toString(),
    });
    const responseText = await wfpResponse.text();
    let responseJson: Record<string, unknown> | null = null;
    try { responseJson = JSON.parse(responseText); } catch { responseJson = null; }
    const paymentUrl = typeof responseJson?.url === "string"
      ? responseJson.url
      : (/^https:\/\/secure\.wayforpay\.com\/page\?/i.test(wfpResponse.url) ? wfpResponse.url : "");

    if (!wfpResponse.ok || !paymentUrl) {
      await supabase.from("wayforpay_orders").update({
        status: "failed",
        raw_callback: {
          status: wfpResponse.status,
          reason: typeof responseJson?.reason === "string" ? responseJson.reason : null,
          reasonCode: typeof responseJson?.reasonCode === "number" || typeof responseJson?.reasonCode === "string" ? responseJson.reasonCode : null,
          body: responseText.slice(0, 500),
        },
      }).eq("order_reference", orderRef);
      console.error("wayforpay payment page creation failed", wfpResponse.status, responseText.slice(0, 300));
      return new Response(JSON.stringify({ error: "WayForPay не створив платіжну сторінку. Перевір Merchant Domain та Secret Key у реквізитах події." }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({
      checkout: {
        ...checkout,
        paymentUrl,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
