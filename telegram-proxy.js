/**
 * Cloudflare Worker — прокси для отправки заявок в Telegram.
 * ---------------------------------------------------------------------------
 * Зачем: если вписать токен бота прямо в script.js, его увидит любой
 * посетитель сайта (скрипт отдаётся браузеру как обычный текст) и сможет
 * писать от имени вашего бота. Этот воркер держит токен на сервере —
 * в браузер уходит только адрес воркера.
 *
 * Развернуть (бесплатно, ~5 минут):
 *   1. dash.cloudflare.com → Workers & Pages → Create → Worker
 *   2. Вставить этот файл целиком, нажать Deploy
 *   3. Settings → Variables and Secrets → добавить два секрета:
 *        BOT_TOKEN  — токен от @BotFather
 *        CHAT_ID    — ваш числовой ID (узнать: @userinfobot)
 *   4. Settings → Variables → добавить обычную переменную:
 *        ALLOWED_ORIGIN — адрес сайта, например https://meridiantennis.github.io
 *   5. Скопировать адрес воркера (https://…workers.dev) в script.js:
 *        CONFIG.telegram.proxyUrl = 'https://…workers.dev'
 *      botToken и chatId в script.js при этом оставить пустыми.
 */

const TELEGRAM_API = 'https://api.telegram.org';

/** Простой лимит: не больше N заявок с одного IP за окно. */
const RATE_LIMIT = { max: 5, windowMs: 60_000 };
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const rec = hits.get(ip);

  if (!rec || now - rec.start > RATE_LIMIT.windowMs) {
    hits.set(ip, { start: now, n: 1 });
    // не даём Map расти бесконечно
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (now - v.start > RATE_LIMIT.windowMs) hits.delete(k);
    }
    return false;
  }

  rec.n += 1;
  return rec.n > RATE_LIMIT.max;
}

function corsHeaders(origin, allowed) {
  return {
    'Access-Control-Allow-Origin': allowed || origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = env.ALLOWED_ORIGIN || '';
    const cors = corsHeaders(origin, allowed);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== 'POST') {
      return json({ ok: false, error: 'Method not allowed' }, 405, cors);
    }

    // Принимаем запросы только со своего сайта.
    if (allowed && origin && origin !== allowed) {
      return json({ ok: false, error: 'Forbidden origin' }, 403, cors);
    }

    if (!env.BOT_TOKEN || !env.CHAT_ID) {
      return json({ ok: false, error: 'Worker is not configured' }, 500, cors);
    }

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (rateLimited(ip)) {
      return json({ ok: false, error: 'Too many requests' }, 429, cors);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ ok: false, error: 'Invalid JSON' }, 400, cors);
    }

    const text = typeof payload.text === 'string' ? payload.text.slice(0, 4096) : '';
    if (!text.trim()) {
      return json({ ok: false, error: 'Empty message' }, 400, cors);
    }

    // chat_id берём ТОЛЬКО из секрета — клиент не может его подменить.
    const tg = await fetch(`${TELEGRAM_API}/bot${env.BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.CHAT_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!tg.ok) {
      const detail = await tg.text();
      console.error('Telegram error', tg.status, detail);
      return json({ ok: false, error: 'Telegram rejected the message' }, 502, cors);
    }

    return json({ ok: true }, 200, cors);
  },
};
