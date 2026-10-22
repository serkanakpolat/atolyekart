import { issueToken } from './_jwt.js'

const EVENTS = new Set(['order_created', 'stock_notification_requested'])

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
  if (!EVENTS.has(type) || !productId) {
    res.statusCode = 400
    return res.end(JSON.stringify({ error: 'type ve productId gerekli' }))
  }

  try {
    res.statusCode = 200
    res.end(JSON.stringify({ token: issueToken({ type, productId }) }))
  } catch (err) {
    console.error('[token]', err.message)
    res.statusCode = 500
    res.end(JSON.stringify({ error: 'Token üretilemedi' }))
  }
}
