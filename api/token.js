import { issueToken } from './_jwt.js'
import { clientIp, rateLimit, tooMany } from './_rateLimit.js'

const EVENTS = new Set(['order_created', 'stock_notification_requested', 'question_asked'])
// Soru bir ürüne bağlı değil; token'daki productId boş kalır.
const NO_PRODUCT = new Set(['question_asked'])

export default function handler(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const type = url.searchParams.get('type')
  const productId = url.searchParams.get('productId')

  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'GET') {
    res.statusCode = 405
    return res.end(JSON.stringify({ error: 'Yalnızca GET' }))
  }
  const limit = rateLimit(`token:${clientIp(req)}`, 20, 60)
  if (limit.limited) return tooMany(res, limit.retryAfter)

  const needsProduct = !NO_PRODUCT.has(type)
  if (!EVENTS.has(type) || (needsProduct && (!productId || productId.length > 100))) {
    res.statusCode = 400
    return res.end(JSON.stringify({ error: 'type ve productId gerekli' }))
  }

  try {
    res.statusCode = 200
    res.end(JSON.stringify({ token: issueToken({ type, productId: needsProduct ? productId : '' }) }))
  } catch (err) {
    console.error('[token]', err.message)
    res.statusCode = 500
    res.end(JSON.stringify({ error: 'Token üretilemedi' }))
  }
}
