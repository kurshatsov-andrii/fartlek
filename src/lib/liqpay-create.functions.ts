import { createServerFn } from "@tanstack/react-start";
import { createHash } from "node:crypto";
import { adminClient, getAuthedUser, getClientOrigin, supabaseProjectRef } from "@/lib/server-supabase";

function sign(privateKey: string, dataB64: string) {
  return createHash("sha1").update(privateKey + dataB64 + privateKey).digest("base64");
}

type Input = { registration_id: string };

type Result = {
  error?: string;
  checkout?: { action: string; data: string; signature: string };
};

export const liqpayCreate = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => (input ?? {}) as Input)
  .handler(async ({ data: input }): Promise<Result> => {
    const authed = await getAuthedUser();
    if (!authed) return { error: "unauthorized" };
    const user = authed.user;

    const registration_id = input.registration_id;
    if (!registration_id) return { error: "registration_id required" };

    const supabase = adminClient();

    const { data: reg, error: regErr } = await supabase
      .from("registrations")
      .select("id, user_id, event_id, distance_id, payment_status, events(title), distances(distance_km, name, price)")
      .eq("id", registration_id)
      .maybeSingle();
    if (regErr || !reg) return { error: "registration not found" };
    if (reg.user_id !== user.id) return { error: "forbidden" };
    if (reg.payment_status === "paid") return { error: "already paid" };

    const { data: settings } = await supabase
      .from("event_payment_settings")
      .select("liqpay_public_key, liqpay_private_key")
      .eq("event_id", reg.event_id)
      .maybeSingle();

    const PUBLIC_KEY = settings?.liqpay_public_key;
    const PRIVATE_KEY = settings?.liqpay_private_key;
    if (!PUBLIC_KEY || !PRIVATE_KEY) {
      return { error: "Організатор не налаштував реквізити LiqPay для цієї події" };
    }

    const basePrice = Number((reg as { distances?: { price?: number } }).distances?.price ?? 0);

    const { data: redemptions } = await supabase
      .from("promo_code_redemptions")
      .select("discount_amount")
      .eq("registration_id", reg.id);
    const discount = (redemptions ?? []).reduce(
      (sum: number, r: { discount_amount?: number }) => sum + Number(r.discount_amount ?? 0),
      0,
    );
    const amount = Math.max(Number((basePrice - discount).toFixed(2)), 0);
    if (amount <= 0) return { error: "free registration" };

    const orderRef = `reg_${reg.id}_${Date.now()}`;
    const regJoined = reg as { events?: { title?: string }; distances?: { distance_km?: number } };
    const description = `${regJoined.events?.title} — ${regJoined.distances?.distance_km}km`;

    // Callback stays on the Supabase edge function (fixed external URL).
    const serverUrl = `https://${supabaseProjectRef()}.supabase.co/functions/v1/liqpay-callback`;
    const origin = getClientOrigin().replace(/\/$/, "");
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

    const dataB64 = Buffer.from(JSON.stringify(payload)).toString("base64");
    const signature = sign(PRIVATE_KEY, dataB64);

    await supabase.from("liqpay_orders").insert({
      order_reference: orderRef,
      registration_id: reg.id,
      user_id: user.id,
      amount,
      currency: "UAH",
      status: "created",
    });

    return {
      checkout: {
        action: "https://www.liqpay.ua/api/3/checkout",
        data: dataB64,
        signature,
      },
    };
  });
