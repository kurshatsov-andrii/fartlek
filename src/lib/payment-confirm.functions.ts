import { createServerFn } from "@tanstack/react-start";
import { adminClient, getAuthedUser } from "@/lib/server-supabase";

type Input = { order: string };

type Result = {
  ok?: boolean;
  error?: string;
  registration_id?: string;
  order_status?: string | null;
  payment_status?: string | null;
  paid?: boolean;
};

export const paymentConfirm = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => (input ?? {}) as Input)
  .handler(async ({ data }): Promise<Result> => {
    const authed = await getAuthedUser();
    if (!authed) return { error: "unauthorized" };
    const userId = authed.user.id;

    const orderRef = String(data.order ?? "").trim();
    if (!orderRef) return { error: "missing order" };

    const admin = adminClient();

    // Знайти order (WFP або LiqPay)
    let registrationId: string | null = null;
    let orderUserId: string | null = null;
    let orderStatus: string | null = null;

    const { data: wfp } = await admin
      .from("wayforpay_orders")
      .select("registration_id, user_id, status")
      .eq("order_reference", orderRef)
      .maybeSingle();

    if (wfp) {
      registrationId = wfp.registration_id;
      orderUserId = wfp.user_id;
      orderStatus = wfp.status;
    } else {
      const { data: lp } = await admin
        .from("liqpay_orders")
        .select("registration_id, user_id, status")
        .eq("order_reference", orderRef)
        .maybeSingle();
      if (lp) {
        registrationId = lp.registration_id;
        orderUserId = lp.user_id;
        orderStatus = lp.status;
      }
    }

    if (!registrationId) return { error: "order not found" };
    if (orderUserId !== userId) return { error: "forbidden" };

    // Повертаємо реальний статус — НЕ позначаємо paid без callback від провайдера.
    const { data: reg } = await admin
      .from("registrations")
      .select("payment_status")
      .eq("id", registrationId)
      .maybeSingle();

    const paid = orderStatus === "paid" || reg?.payment_status === "paid";

    return {
      ok: true,
      registration_id: registrationId,
      order_status: orderStatus,
      payment_status: reg?.payment_status ?? null,
      paid,
    };
  });
