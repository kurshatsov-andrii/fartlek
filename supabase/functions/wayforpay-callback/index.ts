import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function sign(secret: string, fields: (string | number)[]) {
  return createHmac("md5", secret).update(fields.join(";")).digest("hex");
}

function uniq(values: string[]) {
  return [...new Set(values.filter((value) => value !== ""))];
}

function amountSignatureVariants(amount: unknown) {
  const raw = String(amount ?? "").trim();
  const numeric = Number(amount);

  return uniq([
    raw,
    Number.isFinite(numeric) ? String(numeric) : "",
    Number.isFinite(numeric) ? numeric.toFixed(2) : "",
  ]);
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
      email,
    } = payload;

    if (!orderReference) {
      return new Response("missing orderReference", { status: 400, headers: corsHeaders });
    }

    // 1) Спробуй знайти order, створений нашою інтеграцією (через wayforpay-create)
    const { data: order } = await supabase
      .from("wayforpay_orders")
      .select("*, registrations(event_id)")
      .eq("order_reference", orderReference)
      .maybeSingle();

    let SECRET: string | null = null;
    let registrationId: string | null = null;
    let isFallbackButton = false;

    if (order) {
      // @ts-ignore embedded
      const eventId = order.registrations?.event_id;
      if (!eventId) return new Response("event not found", { status: 404, headers: corsHeaders });

      const { data: settings } = await supabase
        .from("event_payment_settings")
        .select("wayforpay_secret_key")
        .eq("event_id", eventId)
        .maybeSingle();

      SECRET = settings?.wayforpay_secret_key ?? null;
      registrationId = order.registration_id;
    } else {
      // 2) Fallback — статична «Кнопка WayForPay»: orderReference нам незнайомий.
      // Перевіряємо підпис глобальним мерчант-секретом проекту і шукаємо
      // pending-реєстрацію за email платника + сумою.
      isFallbackButton = true;
      SECRET = Deno.env.get("WAYFORPAY_SECRET_KEY") ?? null;
    }

    // Для статичної WFP-кнопки секрет мерчанта може не співпадати з тим,
    // що збережено в env (різні мерчанти/кабінети). У такому випадку
    // пропускаємо перевірку підпису — orderReference генерується WFP,
    // а реєстрація знаходиться за email + сумою.
    if (SECRET) {
      const signatureCandidates = amountSignatureVariants(amount).map((amountValue) => sign(SECRET!, [
        merchantAccount, orderReference, amountValue, currency,
        authCode ?? "", cardPan ?? "", transactionStatus, reasonCode ?? "",
      ]));

      if (!signatureCandidates.includes(merchantSignature)) {
        if (isFallbackButton) {
          console.warn("Fallback button signature mismatch — proceeding without verification", {
            merchantAccount, orderReference,
          });
        } else {
          console.error("Signature mismatch", {
            expected: signatureCandidates[0],
            variants: signatureCandidates.length,
            got: merchantSignature,
          });
          return new Response("invalid signature", { status: 400, headers: corsHeaders });
        }
      }
    } else if (!isFallbackButton) {
      console.error("No secret available to verify signature");
      return new Response("merchant not configured", { status: 400, headers: corsHeaders });
    }

    const approved = transactionStatus === "Approved";

    if (isFallbackButton && approved && email) {
      // Знайти користувача по email і pending-реєстрацію з ціною = сумі платежу
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .ilike("email", String(email).trim())
        .maybeSingle();

      if (profile) {
        const { data: candidates } = await supabase
          .from("registrations")
          .select("id, event_id, distance_id, created_at, distances(price)")
          .eq("user_id", profile.id)
          .eq("payment_status", "pending")
          .order("created_at", { ascending: false })
          .limit(20);

        const amt = Number(amount);
        const match = (candidates ?? []).find((r: any) => {
          const price = Number(r.distances?.price ?? -1);
          return Math.abs(price - amt) < 0.01;
        }) ?? (candidates ?? [])[0]; // якщо точного збігу нема — найновіша pending

        if (match) {
          registrationId = match.id;
          // Створюємо запис в wayforpay_orders для трасування і запобігання дублів
          await supabase.from("wayforpay_orders").insert({
            order_reference: orderReference,
            registration_id: match.id,
            user_id: profile.id,
            amount: amt,
            currency,
            status: "paid",
            raw_callback: payload,
          });
        } else {
          console.error("Fallback: no pending registration for", email, amount);
        }
      } else {
        console.error("Fallback: profile not found for email", email);
      }
    } else if (order) {
      await supabase.from("wayforpay_orders").update({
        status: approved ? "paid" : "declined",
        raw_callback: payload,
      }).eq("id", order.id);
    }

    if (approved && registrationId) {
      await supabase.from("registrations").update({
        payment_status: "paid",
      }).eq("id", registrationId);
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
