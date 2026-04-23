import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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

    const body = await req.json();
    const userId: string | undefined = body?.user_id;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'No user_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name, city, club, created_at')
      .eq('id', userId)
      .maybeSingle();

    const { data: roleRow } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    const roleLabel = roleRow?.role === 'organizer'
      ? 'Організатор'
      : roleRow?.role === 'admin'
        ? 'Адміністратор'
        : 'Учасник';

    const text =
      `👤 <b>Новий користувач на платформі!</b>\n\n` +
      `<b>Ім'я:</b> ${escapeHtml(profile?.full_name || '—')}\n` +
      `<b>Email:</b> ${escapeHtml(profile?.email || '—')}\n` +
      `<b>Роль:</b> ${escapeHtml(roleLabel)}\n` +
      `<b>Місто:</b> ${escapeHtml(profile?.city || '—')}\n` +
      `<b>Клуб:</b> ${escapeHtml(profile?.club || '—')}`;

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
    if (!tgRes.ok) {
      throw new Error(`Telegram error [${tgRes.status}]: ${JSON.stringify(tgData)}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('telegram-notify-signup error:', msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
