// Sipariş ve stok bildirimi istekleri buraya gelir.
// Vercel'de serverless fonksiyon olarak, yerelde `npm run dev` içinde Vite middleware'i olarak çalışır.
import { verifyToken } from './_jwt.js'

const recent = []

async function readBody(req) {
  if (req.body !== undefined) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  let raw = ''
  for await (const chunk of req) raw += chunk
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

  let body
  try {
    body = await readBody(req)
  } catch {
    return send(res, 400, { error: 'Geçersiz JSON' })
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
  return send(res, 200, { ok: true })
}
