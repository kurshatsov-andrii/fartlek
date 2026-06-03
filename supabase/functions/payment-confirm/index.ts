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

    // Validate JWT and get user
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

    // Try WayForPay first, then LiqPay
    let registrationId: string | null = null;
    let orderUserId: string | null = null;

    const { data: wfp } = await admin
      .from("wayforpay_orders")
      .select("registration_id, user_id")
      .eq("order_reference", orderRef)
      .maybeSingle();

    if (wfp) {
      registrationId = wfp.registration_id;
      orderUserId = wfp.user_id;
    } else {
      const { data: lp } = await admin
        .from("liqpay_orders")
        .select("registration_id, user_id")
        .eq("order_reference", orderRef)
        .maybeSingle();
      if (lp) {
        registrationId = lp.registration_id;
        orderUserId = lp.user_id;
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

    // Check current registration status — don't overwrite if already paid
    const { data: reg } = await admin
      .from("registrations")
      .select("payment_status")
      .eq("id", registrationId)
      .maybeSingle();

    if (reg && reg.payment_status !== "paid") {
      await admin
        .from("registrations")
        .update({ payment_status: "paid" })
        .eq("id", registrationId);
    }

    return new Response(JSON.stringify({ ok: true, registration_id: registrationId }), {
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
