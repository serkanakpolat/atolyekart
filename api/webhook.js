// Sipariş ve stok bildirimi istekleri buraya gelir.
// Vercel'de serverless fonksiyon olarak, yerelde `npm run dev` içinde Vite middleware'i olarak çalışır.
import { verifyToken } from './_jwt.js'
import { validatePayload } from './_validate.js'
import { clientIp, rateLimit, tooMany } from './_rateLimit.js'

const MAX_BODY = 8 * 1024
const recent = []

async function readBody(req) {
  if (req.body !== undefined) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  let raw = ''
  for await (const chunk of req) {
    raw += chunk
    if (raw.length > MAX_BODY) throw new Error('too large')
  }
  return JSON.parse(raw)
}

function send(res, status, data) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(data))
}

export default async function handler(req, res) {
  // Liste müşteri iletişim bilgisi içerir; yalnızca yerelde açık. Canlıda Vercel Logs kullanılır.
  if (req.method === 'GET' && !process.env.VERCEL) return send(res, 200, recent)
  if (req.method !== 'POST') return send(res, 405, { error: 'Yalnızca POST' })

  const ip = clientIp(req)
  const limit = rateLimit(`webhook:${ip}`, 10, 60)
  if (limit.limited) {
    console.warn(`[webhook] hız sınırı: ${ip}`)
    return tooMany(res, limit.retryAfter)
  }

  let body
  try {
    body = await readBody(req)
  } catch {
    return send(res, 400, { error: 'Geçersiz JSON' })
  }

  const invalid = validatePayload(body)
  if (invalid) {
    console.warn(`[webhook] reddedildi (${ip}): ${invalid}`)
    return send(res, 400, { error: invalid })
  }

  let tokenError
  try {
    tokenError = verifyToken(body.jwt, { type: body.event, productId: String(body.productId) })
  } catch (err) {
    console.error('[webhook]', err.message)
    return send(res, 500, { error: 'Sunucu yapılandırması eksik' })
  }

  recent.unshift({ receivedAt: new Date().toISOString(), ok: !tokenError, tokenError, payload: body })
  recent.length = Math.min(recent.length, 50)
  console.log(`[webhook] ${body.event} — ${body.productName} — jwt: ${tokenError || 'geçerli'}`)
  console.log(body)

  if (tokenError) return send(res, 401, { error: tokenError })
  await forwardToN8n(body)
  return send(res, 200, { ok: true })
}

// Her olay kendi n8n akışına gider; iki akış da aynı "Ortak Doğrulama" sub-workflow'unu çağırır.
const N8N_URL_ENV = {
  order_created: 'N8N_WEBHOOK_URL', // Sheet kaydı + AI teşekkür maili
  stock_notification_requested: 'N8N_STOCK_WEBHOOK_URL', // stok talebi kaydı + AI alternatif ürün önerisi
}

// Doğrulanmış isteği n8n akışına iletir.
// n8n hemen yanıt verir (Respond: Immediately); asıl iş n8n tarafında sürer.
// n8n'e ulaşılamazsa müşteriye hata gösterilmez: istek zaten alındı ve loglandı.
async function forwardToN8n(body) {
  const envName = N8N_URL_ENV[body.event]
  const url = process.env[envName]
  if (!url) return console.warn(`[n8n] ${envName} tanımlı değil, iletilmedi`)
  const { jwt, ...payload } = body
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    })
    console.log(`[n8n] iletildi: ${res.status}`)
  } catch (err) {
    console.error('[n8n] iletilemedi:', err.message)
  }
}
