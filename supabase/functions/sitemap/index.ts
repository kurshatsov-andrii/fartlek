import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const SITE_URL = 'https://fartlek.lovable.app';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CATEGORIES = ['run', 'half_marathon', 'marathon', 'ultra', 'trail', 'ocr', 'online'];

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function urlEntry(loc: string, lastmod?: string, changefreq?: string, priority?: string): string {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}${changefreq ? `\n    <changefreq>${changefreq}</changefreq>` : ''}${priority ? `\n    <priority>${priority}</priority>` : ''}
  </url>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(SUPABASE_URL, ANON_KEY);

    const { data: events } = await supabase
      .from('events')
      .select('id, slug, updated_at, status')
      .in('status', ['published', 'completed'])
      .order('updated_at', { ascending: false });

    const urls: string[] = [];
    urls.push(urlEntry(`${SITE_URL}/`, undefined, 'daily', '1.0'));
    urls.push(urlEntry(`${SITE_URL}/category`, undefined, 'weekly', '0.9'));
    urls.push(urlEntry(`${SITE_URL}/contacts`, undefined, 'monthly', '0.5'));
    urls.push(urlEntry(`${SITE_URL}/auth`, undefined, 'monthly', '0.4'));

    for (const cat of CATEGORIES) {
      urls.push(urlEntry(`${SITE_URL}/category/${cat}`, undefined, 'weekly', '0.8'));
    }

    for (const ev of events ?? []) {
      const slugOrId = ev.slug || ev.id;
      const lastmod = ev.updated_at ? new Date(ev.updated_at).toISOString().split('T')[0] : undefined;
      const priority = ev.status === 'published' ? '0.9' : '0.6';
      urls.push(urlEntry(`${SITE_URL}/events/${slugOrId}`, lastmod, 'weekly', priority));
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`<!-- error: ${msg} -->`, {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/xml' },
    });
  }
});
