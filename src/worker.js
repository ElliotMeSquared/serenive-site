/* Serenive Beauty & Spa — the Worker behind the site.

   Static files in /public are served by Cloudflare's asset handling. This script only sees
   requests that no file answers, which in practice means the two form endpoints:

     POST /api/contact     the Visit page's contact form → an email to the spa
     POST /api/newsletter  the sign-up forms → stored in KV, and an email to the spa

   Email goes out through Cloudflare Email Service (the EMAIL binding) from the sending
   subdomain mail.serenive.com.au, with the visitor's address as Reply-To so the team can
   answer from their inbox. Every submission is also written to KV, so nothing is lost if
   sending ever fails.

   Spam handling, in order: same-origin check, a honeypot field people never see, a minimum
   fill time, and a per-address hourly limit. Spam gets a quiet "ok" so bots learn nothing. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_FILL_MS = 3000;
const HOURLY_LIMIT = 6;
const KEEP_SUBMISSIONS_FOR = 60 * 60 * 24 * 90; // seconds: 90 days

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/contact' || url.pathname === '/api/newsletter') {
      return handleForm(request, env, url);
    }
    return env.ASSETS.fetch(request);
  },
};

async function handleForm(request, env, url) {
  if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405, { Allow: 'POST' });

  // Only the site's own pages may post here.
  const origin = request.headers.get('Origin');
  if (!origin || new URL(origin).host !== url.host) return json({ ok: false, error: 'Forbidden' }, 403);

  const fields = await readFields(request);
  if (!fields) return json({ ok: false, error: 'Bad request' }, 400);

  // Bot checks. A filled honeypot or an instant submit gets a quiet success.
  const tooFast = Number(fields.t) > 0 && Date.now() - Number(fields.t) < MIN_FILL_MS;
  if (fields.website || tooFast) return json({ ok: true });

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (await overLimit(env.FORMS, ip)) {
    return json({ ok: false, error: 'Too many messages from this connection. Please try again in an hour, or call us.' }, 429);
  }

  const email = String(fields.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) return json({ ok: false, error: 'Please check the email address.' }, 400);

  const when = new Date();
  const meta = { at: when.toISOString(), ip, country: request.cf?.country || '', page: request.headers.get('Referer') || '' };

  if (url.pathname === '/api/contact') return contact(fields, email, meta, env);
  return newsletter(email, meta, env);
}

async function contact(fields, email, meta, env) {
  const name = clean(fields.name, 100);
  const phone = clean(fields.phone, 40);
  const message = clean(fields.message, 5000);
  if (!name || !message) return json({ ok: false, error: 'Please add your name and a message.' }, 400);

  const record = { kind: 'contact', name, email, phone, message, ...meta };
  const key = `contact:${meta.at}:${rand()}`;
  await env.FORMS.put(key, JSON.stringify(record), { expirationTtl: KEEP_SUBMISSIONS_FOR });

  const lines = [
    `Name: ${name}`,
    `Email: ${email}`,
    phone ? `Phone: ${phone}` : null,
    '',
    message,
    '',
    '—',
    `Sent from the website contact form on ${pretty(meta.at)}${meta.page ? ` (${meta.page})` : ''}.`,
    'Reply to this email to answer them.',
  ].filter((l) => l !== null);

  const sent = await send(env, {
    to: env.CONTACT_TO,
    replyTo: { email, name },
    subject: `Website enquiry from ${name}`,
    text: lines.join('\n'),
    html: htmlMail('Website enquiry', [
      row('Name', name), row('Email', `<a href="mailto:${esc(email)}">${esc(email)}</a>`), phone ? row('Phone', phone) : '',
      `<p style="margin:20px 0 0;white-space:pre-wrap">${esc(message)}</p>`,
    ], `Sent from the website contact form on ${esc(pretty(meta.at))}. Reply to this email to answer ${esc(name)}.`),
  });

  if (!sent) return json({ ok: false, error: 'We couldn’t send your message just now. Please try again, or call us on (08) 8182 4682.' }, 502);
  return json({ ok: true });
}

async function newsletter(email, meta, env) {
  const key = `subscriber:${email}`;
  const existing = await env.FORMS.get(key);
  if (!existing) {
    await env.FORMS.put(key, JSON.stringify({ kind: 'subscriber', email, ...meta }));
    await send(env, {
      to: env.CONTACT_TO,
      subject: `New newsletter sign-up: ${email}`,
      text: `${email} joined the Serenive community from the website on ${pretty(meta.at)}${meta.page ? ` (${meta.page})` : ''}.\n\nThe full list is kept in the site's KV store (serenive-site-forms) and can be exported at any time.`,
      html: htmlMail('New newsletter sign-up', [row('Email', `<a href="mailto:${esc(email)}">${esc(email)}</a>`), row('When', esc(pretty(meta.at)))],
        'The full list is kept in the site’s KV store (serenive-site-forms) and can be exported at any time.'),
    });
  }
  return json({ ok: true });
}

/* ---- helpers ---- */

async function readFields(request) {
  const type = request.headers.get('Content-Type') || '';
  try {
    if (type.includes('application/json')) return await request.json();
    const form = await request.formData();
    const out = {};
    for (const [k, v] of form.entries()) if (typeof v === 'string') out[k] = v;
    return out;
  } catch {
    return null;
  }
}

async function overLimit(kv, ip) {
  const key = `rl:${ip}`;
  const count = Number((await kv.get(key)) || 0) + 1;
  await kv.put(key, String(count), { expirationTtl: 3600 });
  return count > HOURLY_LIMIT;
}

async function send(env, message) {
  try {
    await env.EMAIL.send({ from: { email: env.FROM_ADDRESS, name: env.FROM_NAME }, ...message });
    return true;
  } catch (e) {
    console.error('Email send failed', e.code, e.message);
    return false;
  }
}

function clean(value, max) {
  return String(value || '').replace(/\r\n?/g, '\n').trim().slice(0, max);
}
function rand() {
  return Math.random().toString(36).slice(2, 8);
}
function pretty(iso) {
  return new Date(iso).toLocaleString('en-AU', { timeZone: 'Australia/Adelaide', dateStyle: 'medium', timeStyle: 'short' });
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
function row(label, value) {
  return `<p style="margin:0 0 6px"><span style="color:#5c6b58">${label}:</span> ${value}</p>`;
}
function htmlMail(title, parts, footer) {
  return `<!doctype html><html><body style="margin:0;background:#f9f5ee;font-family:Helvetica,Arial,sans-serif;color:#2f4a3b">
<div style="max-width:560px;margin:0 auto;padding:32px 24px">
<p style="margin:0 0 4px;font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:#7a6136">Serenive website</p>
<h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:26px">${title}</h1>
${parts.join('')}
<hr style="border:0;border-top:1px solid #d4b07a;margin:28px 0 12px">
<p style="margin:0;font-size:13px;color:#5c6b58">${footer}</p>
</div></body></html>`;
}
function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });
}
