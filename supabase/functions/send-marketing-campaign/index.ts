import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend'
const FROM_ADDRESS = 'Фартлек <news@fartlek.com.ua>'
const SITE_URL = 'https://fartlek.lovable.app'
const BATCH_DELAY_MS = 250 // ~4/sec — safe for Resend free tier

function jsonResponse(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildHtml(opts: {
  recipientName: string | null
  introText: string
  events: Array<{ id: string; slug: string | null; title: string; event_date: string; location: string | null }>
  unsubscribeUrl: string
}): string {
  const greeting = opts.recipientName
    ? `Привіт, ${escapeHtml(opts.recipientName.split(' ')[0])}!`
    : 'Привіт!'

  const eventsHtml = opts.events
    .map((e) => {
      const url = `${SITE_URL}/events/${e.slug ?? e.id}`
      const dateStr = new Date(e.event_date).toLocaleDateString('uk-UA', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
      const loc = e.location ? ` · ${escapeHtml(e.location)}` : ''
      return `
        <tr><td style="padding:12px 0;border-bottom:1px solid #eee;">
          <a href="${url}" style="color:#0a7c5a;text-decoration:none;font-weight:600;font-size:16px;">${escapeHtml(e.title)}</a>
          <div style="color:#666;font-size:13px;margin-top:4px;">${dateStr}${loc}</div>
          <a href="${url}" style="display:inline-block;margin-top:8px;color:#0a7c5a;font-size:13px;">Зареєструватись →</a>
        </td></tr>`
    })
    .join('')

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
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">${escapeHtml(opts.introText).replace(/\n/g, '<br>')}</p>
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
</body></html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
  const resendApiKey = Deno.env.get('RESEND_API_KEY')

  if (!supabaseUrl || !supabaseServiceKey) return jsonResponse({ error: 'Server config missing' }, 500)
  if (!lovableApiKey || !resendApiKey) return jsonResponse({ error: 'Resend not configured' }, 500)

  // Verify caller is admin OR organizer of the campaign's events
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return jsonResponse({ error: 'Unauthorized' }, 401)

  const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401)

  const admin = createClient(supabaseUrl, supabaseServiceKey)
  const { data: roleCheck } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle()
  const isAdminUser = !!roleCheck

  // Parse input
  let body: any
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400)
  }

  const { campaign_id, test_email, batch_size, batch_offset } = body
  if (!campaign_id || typeof campaign_id !== 'string') {
    return jsonResponse({ error: 'campaign_id required' }, 400)
  }
  const bSize = Math.max(1, Math.min(200, Number(batch_size) || 50))
  const bOffset = Math.max(0, Number(batch_offset) || 0)

  // Load campaign
  const { data: campaign, error: cErr } = await admin
    .from('marketing_campaigns')
    .select('*')
    .eq('id', campaign_id)
    .maybeSingle()
  if (cErr || !campaign) return jsonResponse({ error: 'Campaign not found' }, 404)

  // Authorize: admin always; organizer only if all event_ids belong to them,
  // or if the audience is restricted to a single own event.
  const filter = (campaign.audience_filter as any) || {}
  const audienceEventId: string | null = typeof filter.event_id === 'string' ? filter.event_id : null

  if (!isAdminUser) {
    const eventsToCheck = new Set<string>([
      ...(campaign.event_ids ?? []),
      ...(audienceEventId ? [audienceEventId] : []),
    ])
    if (eventsToCheck.size === 0) {
      return jsonResponse({ error: 'Forbidden' }, 403)
    }
    const { data: ownEvents } = await admin
      .from('events')
      .select('id')
      .in('id', Array.from(eventsToCheck))
      .eq('organizer_id', user.id)
    const ownSet = new Set((ownEvents ?? []).map((e: any) => e.id))
    for (const id of eventsToCheck) {
      if (!ownSet.has(id)) return jsonResponse({ error: 'Forbidden: not your event' }, 403)
    }
  }

  // Load events (optional — may be empty for org event-targeted info letters)
  let sortedEvents: Array<{ id: string; slug: string | null; title: string; event_date: string; location: string | null }> = []
  if (campaign.event_ids?.length) {
    const { data: events } = await admin
      .from('events')
      .select('id, slug, title, event_date, location, status')
      .in('id', campaign.event_ids)

    sortedEvents = (events ?? [])
      .map((e) => ({ id: e.id, slug: e.slug, title: e.title, event_date: e.event_date, location: e.location }))
      .sort((a, b) => a.event_date.localeCompare(b.event_date))
  }
  if (!sortedEvents.length && !campaign.intro_text?.trim()) {
    return jsonResponse({ error: 'Either events or intro text required' }, 400)
  }

  // Determine recipients
  type Recipient = { email: string; full_name: string | null }
  let allRecipients: Recipient[] = []

  if (test_email) {
    allRecipients = [{ email: test_email, full_name: 'Тест' }]
  } else if (audienceEventId) {
    // Recipients = users registered for this event (still respecting marketing_consent)
    const { data: regs, error: rErr } = await admin
      .from('registrations')
      .select('user_id')
      .eq('event_id', audienceEventId)
    if (rErr) return jsonResponse({ error: rErr.message }, 500)
    const userIds = Array.from(new Set((regs ?? []).map((r: any) => r.user_id)))
    if (userIds.length === 0) {
      allRecipients = []
    } else {
      const { data: profs, error: pErr } = await admin
        .from('profiles')
        .select('email, full_name')
        .in('id', userIds)
        .eq('marketing_consent', true)
        .not('email', 'is', null)
        .order('email', { ascending: true })
      if (pErr) return jsonResponse({ error: pErr.message }, 500)
      const { data: suppressed } = await admin.from('suppressed_emails').select('email')
      const suppressedSet = new Set((suppressed ?? []).map((s) => s.email.toLowerCase()))
      allRecipients = (profs ?? [])
        .filter((p) => p.email && !suppressedSet.has(p.email.toLowerCase()))
        .map((p) => ({ email: p.email!, full_name: p.full_name }))
    }
  } else {
    let q = admin
      .from('profiles')
      .select('email, full_name, city')
      .eq('marketing_consent', true)
      .not('email', 'is', null)
      .order('email', { ascending: true })

    if (filter.city) q = q.ilike('city', filter.city)

    const { data: profs, error: pErr } = await q
    if (pErr) return jsonResponse({ error: pErr.message }, 500)

    // Exclude suppressed
    const { data: suppressed } = await admin.from('suppressed_emails').select('email')
    const suppressedSet = new Set((suppressed ?? []).map((s) => s.email.toLowerCase()))

    allRecipients = (profs ?? [])
      .filter((p) => p.email && !suppressedSet.has(p.email.toLowerCase()))
      .map((p) => ({ email: p.email!, full_name: p.full_name }))
  }

  if (!allRecipients.length) return jsonResponse({ error: 'No recipients' }, 400)

  // Slice for current batch
  const recipients = test_email
    ? allRecipients
    : allRecipients.slice(bOffset, bOffset + bSize)

  if (!recipients.length) {
    return jsonResponse({
      success: true, sent: 0, failed: 0, total: 0,
      total_recipients: allRecipients.length,
      next_offset: null,
      done: true,
    })
  }

  // Mark campaign sending (only on first batch)
  if (!test_email && bOffset === 0) {
    await admin
      .from('marketing_campaigns')
      .update({ status: 'sending', recipient_count: allRecipients.length })
      .eq('id', campaign_id)
  }

  let sent = 0
  let failed = 0

  for (const r of recipients) {
    try {
      // Get/create unsubscribe token
      let token: string
      const { data: existing } = await admin
        .from('email_unsubscribe_tokens')
        .select('token')
        .eq('email', r.email.toLowerCase())
        .is('used_at', null)
        .maybeSingle()

      if (existing?.token) {
        token = existing.token
      } else {
        token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '')
        await admin.from('email_unsubscribe_tokens').insert({
          token,
          email: r.email.toLowerCase(),
        })
      }

      const unsubscribeUrl = `${SITE_URL}/unsubscribe?token=${token}`
      const html = buildHtml({
        recipientName: r.full_name,
        introText: campaign.intro_text || 'Розкажемо про нові події, які скоро відбудуться. Не пропустіть!',
        events: sortedEvents,
        unsubscribeUrl,
      })

      const messageId = `marketing-${campaign_id}-${crypto.randomUUID()}`

      // Log pending
      await admin.from('email_send_log').insert({
        message_id: messageId,
        template_name: 'marketing-campaign',
        recipient_email: r.email,
        status: 'pending',
        metadata: { campaign_id },
      })

      const resp = await fetch(`${GATEWAY_URL}/emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${lovableApiKey}`,
          'X-Connection-Api-Key': resendApiKey,
        },
        body: JSON.stringify({
          from: FROM_ADDRESS,
          to: [r.email],
          subject: campaign.subject,
          html,
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>, <mailto:unsubscribe@fartlek.com.ua>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        }),
      })

      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) {
        failed++
        await admin.from('email_send_log').insert({
          message_id: messageId,
          template_name: 'marketing-campaign',
          recipient_email: r.email,
          status: 'failed',
          error_message: `Resend ${resp.status}: ${JSON.stringify(data)}`.slice(0, 500),
          metadata: { campaign_id },
        })
      } else {
        sent++
        await admin.from('email_send_log').insert({
          message_id: messageId,
          template_name: 'marketing-campaign',
          recipient_email: r.email,
          status: 'sent',
          metadata: { campaign_id, resend_id: data.id },
        })
      }
    } catch (err) {
      failed++
      console.error('send error', r.email, err)
    }

    await new Promise((res) => setTimeout(res, BATCH_DELAY_MS))
  }

  const nextOffset = bOffset + recipients.length
  const done = test_email ? true : nextOffset >= allRecipients.length

  if (!test_email) {
    // Increment campaign counters and finalize when done
    const { data: cur } = await admin
      .from('marketing_campaigns')
      .select('sent_count, failed_count')
      .eq('id', campaign_id)
      .maybeSingle()

    const newSent = (cur?.sent_count ?? 0) + sent
    const newFailed = (cur?.failed_count ?? 0) + failed

    await admin
      .from('marketing_campaigns')
      .update({
        status: done ? (newSent === 0 ? 'failed' : 'sent') : 'sending',
        sent_count: newSent,
        failed_count: newFailed,
        ...(done ? { sent_at: new Date().toISOString() } : {}),
      })
      .eq('id', campaign_id)
  }

  return jsonResponse({
    success: true,
    sent,
    failed,
    total: recipients.length,
    total_recipients: test_email ? recipients.length : allRecipients.length,
    next_offset: done ? null : nextOffset,
    done,
    test: !!test_email,
  })
})
