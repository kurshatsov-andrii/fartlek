import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { adminClient, supabaseAnonKey, supabaseUrl } from "@/lib/server-supabase";

type Input = {
  email: string;
  password: string;
  full_name?: string;
  role?: string;
  marketing_consent?: boolean;
  captcha_token: string;
  redirect_to?: string;
};

export const secureSignup = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => (input ?? {}) as Input)
  .handler(async ({ data }): Promise<{ success?: boolean; error?: string }> => {
    try {
      const { email, password, full_name, role, marketing_consent, captcha_token, redirect_to } = data;

      if (!email || !password || !captcha_token) return { error: "MISSING_FIELDS" };
      if (typeof password !== "string" || password.length < 6) return { error: "WEAK_PASSWORD" };

      // 1) Verify Cloudflare Turnstile token server-side
      const secret = process.env['TURNSTILE_SECRET_KEY'];
      if (!secret) return { error: "SERVER_NOT_CONFIGURED" };

      const ip = getRequestHeader("cf-connecting-ip") ?? getRequestHeader("x-forwarded-for") ?? "";
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
        return { error: "CAPTCHA_FAILED" };
      }

      // 2) Check disposable email domain
      const admin = adminClient();
      const domain = String(email).toLowerCase().split("@")[1] ?? "";
      if (!domain) return { error: "INVALID_EMAIL" };
      const { data: dispo } = await admin
        .from("disposable_email_domains")
        .select("domain")
        .eq("domain", domain)
        .maybeSingle();
      if (dispo) return { error: "DISPOSABLE_EMAIL_NOT_ALLOWED" };

      // 3) Create the user with the captcha_verified server-side flag in app_metadata
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
        if (/already registered|already exists|duplicate/i.test(msg)) {
          return { error: "USER_ALREADY_EXISTS" };
        }
        return { error: msg };
      }

      // 4) Actually SEND the confirmation email via a public client.
      const publicClient = createClient(supabaseUrl(), supabaseAnonKey());
      const { error: sendErr } = await publicClient.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: redirect_to || undefined },
      });
      if (sendErr) {
        console.error("confirmation email send failed", sendErr.message);
      } else {
        console.log("confirmation email sent", email);
      }

      return { success: true };
    } catch (e) {
      console.error("secure-signup error", e);
      return { error: "INTERNAL_ERROR" };
    }
  });
