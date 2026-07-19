import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, password, full_name, role, marketing_consent, captcha_token, redirect_to } =
      await req.json().catch(() => ({} as any));

    if (!email || !password || !captcha_token) {
      return json({ error: "MISSING_FIELDS" }, 400);
    }
    if (typeof password !== "string" || password.length < 6) {
      return json({ error: "WEAK_PASSWORD" }, 400);
    }

    // 1) Verify Cloudflare Turnstile token server-side
    const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
    if (!secret) return json({ error: "SERVER_NOT_CONFIGURED" }, 500);

    const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "";
    const form = new URLSearchParams();
    form.append("secret", secret);
    form.append("response", captcha_token);
    if (ip) form.append("remoteip", ip.split(",")[0].trim());

    const cfResp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
    });
    const cfData = await cfResp.json();
    if (!cfData.success) {
      console.warn("Turnstile failed", cfData["error-codes"]);
      return json({ error: "CAPTCHA_FAILED" }, 400);
    }

    // 2) Check disposable email domain
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const domain = String(email).toLowerCase().split("@")[1] ?? "";
    if (!domain) return json({ error: "INVALID_EMAIL" }, 400);
    const { data: dispo } = await admin
      .from("disposable_email_domains")
      .select("domain")
      .eq("domain", domain)
      .maybeSingle();
    if (dispo) return json({ error: "DISPOSABLE_EMAIL_NOT_ALLOWED" }, 400);

    // 3) Create the user with the captcha_verified server-side flag in app_metadata
    //    (client signUp cannot set app_metadata, so the DB trigger can trust it)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        full_name: full_name ?? "",
        role: role === "organizer" ? "organizer" : "participant",
        marketing_consent: marketing_consent !== false,
        captcha_verified: true,
      },
      app_metadata: {
        provider: "email",
        providers: ["email"],
        captcha_verified: true,
      },
    });

    if (createErr || !created.user) {
      const msg = createErr?.message ?? "CREATE_FAILED";
      console.error("createUser error", msg);
      // Map common errors
      if (/already registered|already exists|duplicate/i.test(msg)) {
        return json({ error: "USER_ALREADY_EXISTS" }, 400);
      }
      return json({ error: msg }, 400);
    }

    // 4) Send confirmation email (signup link)
    const { error: linkErr } = await admin.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: {
        redirectTo: redirect_to || undefined,
      },
    });
    if (linkErr) {
      console.warn("generateLink warning", linkErr.message);
      // Not fatal — user is created; they can use "resend confirmation"
    }

    return json({ success: true });
  } catch (e) {
    console.error("secure-signup error", e);
    return json({ error: "INTERNAL_ERROR" }, 500);
  }
});
