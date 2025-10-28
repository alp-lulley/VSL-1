// functions/api/form.js
export async function onRequest({ request, env }) {
  const { method } = request;

  // Allow CORS preflight or no-body methods to be harmless
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
  if (method === 'GET' || method === 'HEAD') {
    // Helpful for quick checks in the browser
    return new Response('OK', { status: 200 });
  }

  if (method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { Allow: 'POST, OPTIONS, GET, HEAD' },
    });
  }

  try {
    const form = await request.formData();
    const data = {};
    for (const [k, v] of form.entries()) {
      data[k] = k in data ? (Array.isArray(data[k]) ? [...data[k], v] : [data[k], v]) : v;
    }

    const url = env.ZAPIER_WEBHOOK_URL;
    if (!url) return new Response('Missing ZAPIER_WEBHOOK_URL', { status: 500 });

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!r.ok) {
      const t = await r.text().catch(() => '');
      return new Response(`Zapier failed: ${t}`, { status: 502 });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
