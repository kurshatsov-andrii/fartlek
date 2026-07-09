import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const orderRef = String(body.order ?? body.order_reference ?? "").trim();
    if (!orderRef) {
      return new Response(JSON.stringify({ error: "missing order" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

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

    if (!registrationId) {
      return new Response(JSON.stringify({ error: "order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (orderUserId !== userId) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Повертаємо реальний статус — НЕ позначаємо paid без callback від провайдера.
    const { data: reg } = await admin
      .from("registrations")
      .select("payment_status")
      .eq("id", registrationId)
      .maybeSingle();

    const paid = orderStatus === "paid" || reg?.payment_status === "paid";

    return new Response(JSON.stringify({
      ok: true,
      registration_id: registrationId,
      order_status: orderStatus,
      payment_status: reg?.payment_status ?? null,
      paid,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
