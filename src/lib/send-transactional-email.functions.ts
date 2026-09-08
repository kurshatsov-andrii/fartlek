import { createServerFn } from "@tanstack/react-start";
import { adminClient, getAuthedUser } from "@/lib/server-supabase";

// Configuration ported from the previous edge function — keep in sync with the
// verified sender domain configured for this project.
const SITE_NAME = "fartlek";
const SENDER_DOMAIN = "notify.fartlek.com.ua";
const FROM_DOMAIN = "notify.fartlek.com.ua";

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

type Input = {
  templateName?: string;
  template_name?: string;
  recipientEmail?: string;
  recipient_email?: string;
  idempotencyKey?: string;
  idempotency_key?: string;
  templateData?: Record<string, unknown>;
};

type Result = { success?: boolean; queued?: boolean; reason?: string; error?: string };

export const sendTransactionalEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => (input ?? {}) as Input)
  .handler(async ({ data: body }): Promise<Result> => {
    const authed = await getAuthedUser();
    if (!authed) return { error: "Unauthorized" };

    const templateName = body.templateName || body.template_name;
    const recipientEmail = body.recipientEmail || body.recipient_email;
    const messageId = crypto.randomUUID();
    const idempotencyKey = body.idempotencyKey || body.idempotency_key || messageId;
    const templateData: Record<string, unknown> =
      body.templateData && typeof body.templateData === "object" ? body.templateData : {};

    if (!templateName) return { error: "templateName is required" };

    const { TEMPLATES } = await import("@/lib/email-templates/registry");
    const template = TEMPLATES[templateName];
    if (!template) {
      return { error: `Template '${templateName}' not found. Available: ${Object.keys(TEMPLATES).join(", ")}` };
    }

    const effectiveRecipient = template.to || recipientEmail;
    if (!effectiveRecipient) {
      return { error: "recipientEmail is required (unless the template defines a fixed recipient)" };
    }

    const supabase = adminClient();

    // 1) Suppression check (fail-closed)
    const { data: suppressed, error: suppressionError } = await supabase
      .from("suppressed_emails")
      .select("id")
      .eq("email", effectiveRecipient.toLowerCase())
      .maybeSingle();

    if (suppressionError) {
      console.error("Suppression check failed — refusing to send", suppressionError.message);
      return { error: "Failed to verify suppression status" };
    }

    if (suppressed) {
      await supabase.from("email_send_log").insert({
        message_id: messageId,
        template_name: templateName,
        recipient_email: effectiveRecipient,
        status: "suppressed",
      });
      return { success: false, reason: "email_suppressed" };
    }

    // 2) Unsubscribe token (one per email address)
    const normalizedEmail = effectiveRecipient.toLowerCase();
    let unsubscribeToken: string;

    const { data: existingToken, error: tokenLookupError } = await supabase
      .from("email_unsubscribe_tokens")
      .select("token, used_at")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (tokenLookupError) {
      await supabase.from("email_send_log").insert({
        message_id: messageId,
        template_name: templateName,
        recipient_email: effectiveRecipient,
        status: "failed",
        error_message: "Failed to look up unsubscribe token",
      });
      return { error: "Failed to prepare email" };
    }

    if (existingToken && !existingToken.used_at) {
      unsubscribeToken = existingToken.token;
    } else if (!existingToken) {
      unsubscribeToken = generateToken();
      const { error: tokenError } = await supabase
        .from("email_unsubscribe_tokens")
        .upsert({ token: unsubscribeToken, email: normalizedEmail }, { onConflict: "email", ignoreDuplicates: true });

      if (tokenError) {
        await supabase.from("email_send_log").insert({
          message_id: messageId,
          template_name: templateName,
          recipient_email: effectiveRecipient,
          status: "failed",
          error_message: "Failed to create unsubscribe token",
        });
        return { error: "Failed to prepare email" };
      }

      const { data: storedToken, error: reReadError } = await supabase
        .from("email_unsubscribe_tokens")
        .select("token")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (reReadError || !storedToken) {
        await supabase.from("email_send_log").insert({
          message_id: messageId,
          template_name: templateName,
          recipient_email: effectiveRecipient,
          status: "failed",
          error_message: "Failed to confirm unsubscribe token storage",
        });
        return { error: "Failed to prepare email" };
      }
      unsubscribeToken = storedToken.token;
    } else {
      await supabase.from("email_send_log").insert({
        message_id: messageId,
        template_name: templateName,
        recipient_email: effectiveRecipient,
        status: "suppressed",
        error_message: "Unsubscribe token used but email missing from suppressed list",
      });
      return { success: false, reason: "email_suppressed" };
    }

    // 3) Render the template
    const [{ createElement }, { render }] = await Promise.all([
      import("react"),
      import("@react-email/render"),
    ]);
    const html = await render(createElement(template.component, templateData));
    const plainText = await render(createElement(template.component, templateData), { plainText: true });

    const resolvedSubject =
      typeof template.subject === "function" ? template.subject(templateData) : template.subject;

    // 4) Enqueue for the dispatcher (handles sending, retries, backoff)
    await supabase.from("email_send_log").insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: "pending",
    });

    const { error: enqueueError } = await supabase.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        message_id: messageId,
        to: effectiveRecipient,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject: resolvedSubject,
        html,
        text: plainText,
        purpose: "transactional",
        label: templateName,
        idempotency_key: idempotencyKey,
        unsubscribe_token: unsubscribeToken,
        queued_at: new Date().toISOString(),
      },
    });

    if (enqueueError) {
      console.error("Failed to enqueue email", enqueueError.message);
      await supabase.from("email_send_log").insert({
        message_id: messageId,
        template_name: templateName,
        recipient_email: effectiveRecipient,
        status: "failed",
        error_message: "Failed to enqueue email",
      });
      return { error: "Failed to enqueue email" };
    }

    return { success: true, queued: true };
  });
