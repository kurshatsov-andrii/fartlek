import { createServerFn } from "@tanstack/react-start";
import { createHmac } from "node:crypto";
import { getRequestHeader } from "@tanstack/react-start/server";
import { adminClient, getAuthedUser, supabaseProjectRef } from "@/lib/server-supabase";

function sign(secret: string, fields: (string | number)[]) {
  return createHmac("md5", secret).update(fields.join(";")).digest("hex");
}

function money(value: number) {
  return value.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

type Input = { registration_id: string };

export type WayForPayCheckout = {
  merchantAccount: string;
  merchantAuthType?: string;
  merchantDomainName: string;
  merchantTransactionType?: string;
  merchantTransactionSecureType?: string;
  merchantSignature: string;
  orderReference: string;
  orderDate: number;
  amount: number | string;
  currency: string;
  productName: string[];
  productCount: number[];
  productPrice: (number | string)[];
  serviceUrl: string;
  returnUrl: string;
  language: string;
  paymentUrl?: string;
};

type Result = { error?: string; checkout?: WayForPayCheckout };

export const wayforpayCreate = createServerFn({ method: "POST" })
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
    const originHeader = getRequestHeader("Origin") ?? getRequestHeader("Referer") ?? "";
    let originDomain = "";
    try {
      originDomain = originHeader ? new URL(originHeader).hostname : "";
    } catch {
      originDomain = "";
    }
    const DOMAIN = (settings?.wayforpay_merchant_domain || originDomain || "")
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "")
      .trim();

    if (!MERCHANT || !SECRET || !DOMAIN) {
      return { error: "Організатор не налаштував реквізити WayForPay для цієї події" };
    }

    const regJoined = reg as { events?: { title?: string }; distances?: { distance_km?: number; price?: number } };
    const basePrice = Number(regJoined.distances?.price ?? 0);

    // Враховуємо знижку від промокоду (якщо застосований до цієї реєстрації)
    const { data: redemptions } = await supabase
      .from("promo_code_redemptions")
      .select("discount_amount")
      .eq("registration_id", reg.id);
    const discount = (redemptions ?? []).reduce(
      (sum: number, r: { discount_amount?: number }) => sum + Number(r.discount_amount ?? 0),
      0,
    );
    const amount = Math.max(Number((basePrice - discount).toFixed(2)), 0);
    const amountText = money(amount);
    if (amount <= 0) return { error: "free registration" };

    const orderRef = `reg_${reg.id}_${Date.now()}`;
    const productName = `${regJoined.events?.title} — ${regJoined.distances?.distance_km}km`;
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
      return { error: "Не вдалося створити запис замовлення" };
    }

    // Callback stays on the Supabase edge function (fixed external URL).
    const serviceUrl = `https://${supabaseProjectRef()}.supabase.co/functions/v1/wayforpay-callback`;
    const requestOrigin = getRequestHeader("Origin") ?? `https://${DOMAIN}`;
    const origin = settings?.wayforpay_merchant_domain ? `https://${DOMAIN}` : requestOrigin;
    const returnUrl = `${origin}/payment/success?order=${orderRef}`;

    const checkout: WayForPayCheckout = {
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
    form.set("merchantTransactionType", checkout.merchantTransactionType!);
    form.set("merchantTransactionSecureType", checkout.merchantTransactionSecureType!);
    form.set("merchantSignature", checkout.merchantSignature);
    form.set("orderReference", checkout.orderReference);
    form.set("orderDate", String(checkout.orderDate));
    form.set("amount", String(checkout.amount));
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
    try {
      responseJson = JSON.parse(responseText);
    } catch {
      responseJson = null;
    }
    const paymentUrl = typeof responseJson?.['url'] === "string"
      ? (responseJson['url'] as string)
      : (/^https:\/\/secure\.wayforpay\.com\/page\?/i.test(wfpResponse.url) ? wfpResponse.url : "");

    if (!wfpResponse.ok || !paymentUrl) {
      await supabase.from("wayforpay_orders").update({
        status: "failed",
        raw_callback: {
          status: wfpResponse.status,
          reason: typeof responseJson?.['reason'] === "string" ? responseJson['reason'] : null,
          reasonCode:
            typeof responseJson?.['reasonCode'] === "number" || typeof responseJson?.['reasonCode'] === "string"
              ? responseJson['reasonCode']
              : null,
          body: responseText.slice(0, 500),
        },
      }).eq("order_reference", orderRef);
      console.error("wayforpay payment page creation failed", wfpResponse.status, responseText.slice(0, 300));
      return { error: "WayForPay не створив платіжну сторінку. Перевір Merchant Domain та Secret Key у реквізитах події." };
    }

    return { checkout: { ...checkout, paymentUrl } };
  });
