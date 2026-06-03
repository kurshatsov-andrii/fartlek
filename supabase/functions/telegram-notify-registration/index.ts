import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
    const CHAT_ID = Deno.env.get('TELEGRAM_NOTIFY_CHAT_ID');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY || !TELEGRAM_API_KEY || !CHAT_ID || !SUPABASE_URL || !SERVICE_KEY) {
      throw new Error('Missing required env vars');
    }

    // Викликається з DB-тригера без auth-заголовка — пропускаємо перевірку.

    const body = await req.json();
    const registrationId: string | undefined = body?.record?.id ?? body?.registration_id;
    if (!registrationId) {
      return new Response(JSON.stringify({ error: 'No registration id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Fetch registration with related info
    const { data: reg, error: regErr } = await supabase
      .from('registrations')
      .select('id, user_id, athlete_id, event_id, distance_id, payment_status, created_at')
      .eq('id', registrationId)
      .maybeSingle();

    if (regErr || !reg) {
      throw new Error(`Registration not found: ${regErr?.message}`);
    }

    const [{ data: event }, { data: distance }, { data: profile }, { data: athlete }] = await Promise.all([
      supabase.from('events').select('title, event_date, location').eq('id', reg.event_id).maybeSingle(),
      supabase.from('distances').select('distance_km, name, price').eq('id', reg.distance_id).maybeSingle(),
      supabase.from('profiles').select('full_name, email, city, club').eq('id', reg.user_id).maybeSingle(),
      reg.athlete_id
        ? supabase.from('athletes').select('full_name, city, club').eq('id', reg.athlete_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const participantName = athlete?.full_name || profile?.full_name || 'Невідомий';
    const city = athlete?.city || profile?.city || '—';
    const club = athlete?.club || profile?.club || '—';
    const distName = distance?.name ? `${distance.name} (${distance.distance_km} км)` : `${distance?.distance_km ?? '?'} км`;
    const priceStr = distance?.price && Number(distance.price) > 0 ? `${distance.price} грн` : 'Безкоштовно';

    const text =
      `🏃 <b>Нова реєстрація!</b>\n\n` +
      `<b>Подія:</b> ${escapeHtml(event?.title ?? '—')}\n` +
      `<b>Дата:</b> ${escapeHtml(String(event?.event_date ?? '—'))}\n` +
      `<b>Місце:</b> ${escapeHtml(event?.location ?? '—')}\n\n` +
      `<b>Учасник:</b> ${escapeHtml(participantName)}\n` +
      `<b>Email:</b> ${escapeHtml(profile?.email ?? '—')}\n` +
      `<b>Місто:</b> ${escapeHtml(city)}\n` +
      `<b>Клуб:</b> ${escapeHtml(club)}\n\n` +
      `<b>Дистанція:</b> ${escapeHtml(distName)}\n` +
      `<b>Вартість:</b> ${escapeHtml(priceStr)}\n` +
      `<b>Статус оплати:</b> ${escapeHtml(reg.payment_status)}`;

    const tgRes = await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': TELEGRAM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: 'HTML',
      }),
    });

    const tgData = await tgRes.json();
    if (!tgRes.ok) {
      throw new Error(`Telegram error [${tgRes.status}]: ${JSON.stringify(tgData)}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('telegram-notify-registration error:', msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
