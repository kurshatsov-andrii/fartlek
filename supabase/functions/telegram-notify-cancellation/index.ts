import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function escapeHtml(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
    const CHAT_ID = Deno.env.get('TELEGRAM_NOTIFY_CHAT_ID');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!LOVABLE_API_KEY || !TELEGRAM_API_KEY || !CHAT_ID || !SUPABASE_URL || !SERVICE_KEY) {
      throw new Error('Missing env vars');
    }

    const body = await req.json();
    const requestId: string | undefined = body?.record?.id ?? body?.request_id;
    if (!requestId) {
      return new Response(JSON.stringify({ error: 'No request id' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: reqRow, error: reqErr } = await supabase
      .from('registration_cancellation_requests')
      .select('id, registration_id, event_id, user_id, reason, created_at')
      .eq('id', requestId)
      .maybeSingle();
    if (reqErr || !reqRow) throw new Error(`Request not found: ${reqErr?.message}`);

    const { data: reg } = await supabase
      .from('registrations')
      .select('id, bib_number, athlete_id, distance_id')
      .eq('id', reqRow.registration_id).maybeSingle();

    const [{ data: event }, { data: distance }, { data: profile }, { data: athlete }] = await Promise.all([
      supabase.from('events').select('title, event_date, location').eq('id', reqRow.event_id).maybeSingle(),
      reg?.distance_id
        ? supabase.from('distances').select('distance_km, name, price').eq('id', reg.distance_id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from('profiles').select('full_name, email, phone').eq('id', reqRow.user_id).maybeSingle(),
      reg?.athlete_id
        ? supabase.from('athletes').select('full_name').eq('id', reg.athlete_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const participantName = (athlete as any)?.full_name || profile?.full_name || 'Невідомий';
    const distName = distance ? `${(distance as any).name ?? ''} (${(distance as any).distance_km} км)`.trim() : '—';

    const text =
      `⚠️ <b>Заявка на скасування реєстрації</b>\n\n` +
      `<b>Подія:</b> ${escapeHtml(event?.title ?? '—')}\n` +
      `<b>Дата:</b> ${escapeHtml(String(event?.event_date ?? '—'))}\n` +
      `<b>Місце:</b> ${escapeHtml(event?.location ?? '—')}\n\n` +
      `<b>Учасник:</b> ${escapeHtml(participantName)}\n` +
      `<b>Email:</b> ${escapeHtml(profile?.email ?? '—')}\n` +
      `<b>Телефон:</b> ${escapeHtml(profile?.phone ?? '—')}\n` +
      `<b>Номер:</b> ${escapeHtml(reg?.bib_number ?? '—')}\n` +
      `<b>Дистанція:</b> ${escapeHtml(distName)}\n\n` +
      `<b>Причина:</b> ${escapeHtml(reqRow.reason || '—')}\n\n` +
      `<i>Реєстрація не видалена. Розгляньте заявку в кабінеті організатора.</i>`;

    const tgRes = await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': TELEGRAM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' }),
    });
    const tgData = await tgRes.json();
    if (!tgRes.ok) throw new Error(`Telegram [${tgRes.status}]: ${JSON.stringify(tgData)}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('telegram-notify-cancellation error:', msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
