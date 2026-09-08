import { createServerFn } from "@tanstack/react-start";
import { adminClient, getAuthedUser } from "@/lib/server-supabase";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const FROM_ADDRESS = "Фартлек <news@fartlek.com.ua>";
const SITE_URL = "https://fartlek.lovable.app";
const BATCH_DELAY_MS = 250; // ~4/sec — safe for Resend free tier

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type CampaignEvent = { id: string; slug: string | null; title: string; event_date: string; location: string | null };

function buildHtml(opts: {
  recipientName: string | null;
  introText: string;
  events: CampaignEvent[];
  unsubscribeUrl: string;
}): string {
  const greeting = opts.recipientName
    ? `Привіт, ${escapeHtml(opts.recipientName.split(" ")[0])}!`
    : "Привіт!";

  const eventsHtml = opts.events
    .map((e) => {
      const url = `${SITE_URL}/events/${e.slug ?? e.id}`;
      const dateStr = new Date(e.event_date).toLocaleDateString("uk-UA", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const loc = e.location ? ` · ${escapeHtml(e.location)}` : "";
      return `
        <tr><td style="padding:12px 0;border-bottom:1px solid #eee;">
          <a href="${url}" style="color:#0a7c5a;text-decoration:none;font-weight:600;font-size:16px;">${escapeHtml(e.title)}</a>
          <div style="color:#666;font-size:13px;margin-top:4px;">${dateStr}${loc}</div>
          <a href="${url}" style="display:inline-block;margin-top:8px;color:#0a7c5a;font-size:13px;">Зареєструватись →</a>
        </td></tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="uk"><head><meta charset="utf-8"><title>Нові події на Фартлек</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#222;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;max-width:600px;">
        <tr><td style="padding:32px 32px 16px;">
          <h1 style="margin:0;font-size:24px;color:#0a7c5a;">Фартлек</h1>
        </td></tr>
        <tr><td style="padding:0 32px 16px;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.5;">${greeting}</p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">${escapeHtml(opts.introText).replace(/\n/g, "<br>")}</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${eventsHtml}</table>
        </td></tr>
        <tr><td style="padding:24px 32px;background:#fafafa;border-top:1px solid #eee;font-size:12px;color:#888;text-align:center;">
          <p style="margin:0 0 8px;">Ви отримали цей лист, бо зареєстровані на платформі <a href="${SITE_URL}" style="color:#0a7c5a;">Фартлек</a>.</p>
          <p style="margin:0;">
            <a href="${opts.unsubscribeUrl}" style="color:#888;text-decoration:underline;">Відписатися від розсилок</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

type Input = {
  campaign_id?: string;
  test_email?: string;
  batch_size?: number;
  batch_offset?: number;
};

type Result = {
  error?: string;
  success?: boolean;
  sent?: number;
  failed?: number;
  total?: number;
  total_recipients?: number;
  next_offset?: number | null;
  done?: boolean;
  quota_exceeded?: boolean;
  test?: boolean;
};

type Recipient = { email: string; full_name: string | null };

export const sendMarketingCampaign = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => (input ?? {}) as Input)
  .handler(async ({ data: body }): Promise<Result> => {
    const lovableApiKey = process.env['LOVABLE_API_KEY'];
    const resendApiKey = process.env['RESEND_API_KEY'];
    if (!lovableApiKey || !resendApiKey) return { error: "Resend not configured" };

    const authed = await getAuthedUser();
    if (!authed) return { error: "Unauthorized" };
    const user = authed.user;

    const admin = adminClient();

    const { data: roleCheck } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    const isAdminUser = !!roleCheck;

    const campaign_id = body.campaign_id;
    const test_email = body.test_email;
    if (!campaign_id || typeof campaign_id !== "string") return { error: "campaign_id required" };

    const bSize = Math.max(1, Math.min(200, Number(body.batch_size) || 50));
    const bOffset = Math.max(0, Number(body.batch_offset) || 0);

    const { data: campaign, error: cErr } = await admin
      .from("marketing_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .maybeSingle();
    if (cErr || !campaign) return { error: "Campaign not found" };

    const filter = ((campaign as Record<string, any>)['audience_filter'] as Record<string, any>) || {};
    const audienceEventId: string | null = typeof filter['event_id'] === "string" ? filter['event_id'] : null;
    const campaignRow = campaign as Record<string, any>;

    if (!isAdminUser) {
      const eventsToCheck = new Set<string>([
        ...((campaignRow['event_ids'] as string[]) ?? []),
        ...(audienceEventId ? [audienceEventId] : []),
      ]);
      if (eventsToCheck.size === 0) return { error: "Forbidden" };

      const { data: ownEvents } = await admin
        .from("events")
        .select("id")
        .in("id", Array.from(eventsToCheck))
        .eq("organizer_id", user.id);
      const ownSet = new Set((ownEvents ?? []).map((e: { id: string }) => e.id));
      for (const id of eventsToCheck) {
        if (!ownSet.has(id)) return { error: "Forbidden: not your event" };
      }
    }

    let sortedEvents: CampaignEvent[] = [];
    if ((campaignRow['event_ids'] as string[] | null)?.length) {
      const { data: events } = await admin
        .from("events")
        .select("id, slug, title, event_date, location, status")
        .in("id", campaignRow['event_ids'] as string[]);

      sortedEvents = (events ?? [])
        .map((e: Record<string, any>) => ({
          id: e['id'], slug: e['slug'], title: e['title'], event_date: e['event_date'], location: e['location'],
        }))
        .sort((a, b) => a.event_date.localeCompare(b.event_date));
    }
    if (!sortedEvents.length && !String(campaignRow['intro_text'] ?? "").trim()) {
      return { error: "Either events or intro text required" };
    }

    let allRecipients: Recipient[] = [];

    if (test_email) {
      allRecipients = [{ email: test_email, full_name: "Тест" }];
    } else if (audienceEventId) {
      const { data: regs, error: rErr } = await admin
        .from("registrations")
        .select("user_id, created_at")
        .eq("event_id", audienceEventId)
        .order("created_at", { ascending: false });
      if (rErr) return { error: rErr.message };

      const orderedUserIds: string[] = [];
      const seenIds = new Set<string>();
      for (const r of (regs ?? []) as Array<{ user_id: string }>) {
        if (!seenIds.has(r.user_id)) {
          seenIds.add(r.user_id);
          orderedUserIds.push(r.user_id);
        }
      }

      if (orderedUserIds.length > 0) {
        const { data: profs, error: pErr } = await admin
          .from("profiles")
          .select("id, email, full_name")
          .in("id", orderedUserIds)
          .eq("marketing_consent", true)
          .not("email", "is", null);
        if (pErr) return { error: pErr.message };

        const { data: suppressed } = await admin.from("suppressed_emails").select("email");
        const suppressedSet = new Set((suppressed ?? []).map((s: { email: string }) => s.email.toLowerCase()));
        const byId = new Map<string, Recipient>();
        for (const p of (profs ?? []) as Array<{ id: string; email: string | null; full_name: string | null }>) {
          if (p.email && !suppressedSet.has(p.email.toLowerCase())) {
            byId.set(p.id, { email: p.email, full_name: p.full_name });
          }
        }
        allRecipients = orderedUserIds
          .map((uid) => byId.get(uid))
          .filter((r): r is Recipient => !!r);
      }
    } else {
      let q = admin
        .from("profiles")
        .select("email, full_name, city")
        .eq("marketing_consent", true)
        .not("email", "is", null)
        .order("email", { ascending: true });

      if (filter['city']) q = q.ilike("city", filter['city'] as string);

      const { data: profs, error: pErr } = await q;
      if (pErr) return { error: pErr.message };

      const { data: suppressed } = await admin.from("suppressed_emails").select("email");
      const suppressedSet = new Set((suppressed ?? []).map((s: { email: string }) => s.email.toLowerCase()));

      allRecipients = ((profs ?? []) as Array<{ email: string | null; full_name: string | null }>)
        .filter((p) => p.email && !suppressedSet.has(p.email.toLowerCase()))
        .map((p) => ({ email: p.email!, full_name: p.full_name }));
    }

    if (!allRecipients.length) return { error: "No recipients" };

    const recipients = test_email ? allRecipients : allRecipients.slice(bOffset, bOffset + bSize);

    if (!recipients.length) {
      return {
        success: true, sent: 0, failed: 0, total: 0,
        total_recipients: allRecipients.length,
        next_offset: null,
        done: true,
      };
    }

    if (!test_email && bOffset === 0) {
      await admin
        .from("marketing_campaigns")
        .update({ status: "sending", recipient_count: allRecipients.length })
        .eq("id", campaign_id);
    }

    let sent = 0;
    let failed = 0;
    let quotaExceeded = false;
    let stoppedAtIndex = 0;

    for (let i = 0; i < recipients.length; i++) {
      const r = recipients[i];
      stoppedAtIndex = i;
      try {
        let token: string;
        const { data: existing } = await admin
          .from("email_unsubscribe_tokens")
          .select("token")
          .eq("email", r.email.toLowerCase())
          .is("used_at", null)
          .maybeSingle();

        if (existing?.token) {
          token = existing.token;
        } else {
          token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
          await admin.from("email_unsubscribe_tokens").insert({ token, email: r.email.toLowerCase() });
        }

        const unsubscribeUrl = `${SITE_URL}/unsubscribe?token=${token}`;
        const html = buildHtml({
          recipientName: r.full_name,
          introText: (campaignRow['intro_text'] as string) || "Розкажемо про нові події, які скоро відбудуться. Не пропустіть!",
          events: sortedEvents,
          unsubscribeUrl,
        });

        const messageId = `marketing-${campaign_id}-${crypto.randomUUID()}`;

        await admin.from("email_send_log").insert({
          message_id: messageId,
          template_name: "marketing-campaign",
          recipient_email: r.email,
          status: "pending",
          metadata: { campaign_id },
        });

        const resp = await fetch(`${GATEWAY_URL}/emails`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${lovableApiKey}`,
            "X-Connection-Api-Key": resendApiKey,
          },
          body: JSON.stringify({
            from: FROM_ADDRESS,
            to: [r.email],
            subject: campaignRow['subject'],
            html,
            headers: {
              "List-Unsubscribe": `<${unsubscribeUrl}>, <mailto:unsubscribe@fartlek.com.ua>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
          }),
        });

        const data = (await resp.json().catch(() => ({}))) as Record<string, unknown>;
        if (!resp.ok) {
          const errText = JSON.stringify(data);
          const isQuota = resp.status === 429 || /daily_quota_exceeded|quota|rate.?limit/i.test(errText);

          if (isQuota) {
            await admin.from("email_send_log").delete().eq("message_id", messageId);
            quotaExceeded = true;
            break;
          }

          failed++;
          await admin.from("email_send_log").insert({
            message_id: messageId,
            template_name: "marketing-campaign",
            recipient_email: r.email,
            status: "failed",
            error_message: `Resend ${resp.status}: ${errText}`.slice(0, 500),
            metadata: { campaign_id },
          });
        } else {
          sent++;
          await admin.from("email_send_log").insert({
            message_id: messageId,
            template_name: "marketing-campaign",
            recipient_email: r.email,
            status: "sent",
            metadata: { campaign_id, resend_id: data['id'] },
          });
        }
      } catch (err) {
        failed++;
        console.error("send error", r.email, err);
      }

      await new Promise((res) => setTimeout(res, BATCH_DELAY_MS));
    }

    const processedCount = quotaExceeded ? stoppedAtIndex : recipients.length;
    const nextOffset = bOffset + processedCount;
    const done = test_email ? true : !quotaExceeded && nextOffset >= allRecipients.length;

    if (!test_email) {
      const { data: cur } = await admin
        .from("marketing_campaigns")
        .select("sent_count, failed_count")
        .eq("id", campaign_id)
        .maybeSingle();

      const curRow = (cur ?? {}) as Record<string, number | null>;
      const newSent = (curRow['sent_count'] ?? 0) + sent;
      const newFailed = (curRow['failed_count'] ?? 0) + failed;

      const newStatus = done ? (newSent === 0 ? "failed" : "sent") : quotaExceeded ? "paused" : "sending";

      await admin
        .from("marketing_campaigns")
        .update({
          status: newStatus,
          sent_count: newSent,
          failed_count: newFailed,
          ...(done ? { sent_at: new Date().toISOString() } : {}),
        })
        .eq("id", campaign_id);
    }

    return {
      success: true,
      sent,
      failed,
      total: recipients.length,
      total_recipients: test_email ? recipients.length : allRecipients.length,
      next_offset: done ? null : nextOffset,
      done,
      quota_exceeded: quotaExceeded,
      test: !!test_email,
    };
  });
