// IP başına kayan pencere sınırı. Bellekte tutulur: her Vercel fonksiyon kopyası kendi sayacını tutar,
// bu yüzden sınır kopya başınadır. Kesin, dağıtık sınır için ortak depo (Redis) gerekir.
const buckets = new Map()

export function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded) return forwarded.split(',')[0].trim()
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown'
}

// true → sınır aşıldı. retryAfter saniye cinsinden.
export function rateLimit(key, limit, windowSec) {
  const now = Date.now()
  const windowMs = windowSec * 1000
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs)

  if (buckets.size > 10000) {
    for (const [k, v] of buckets) if (!v.length || now - v[v.length - 1] >= windowMs) buckets.delete(k)
  }

  if (hits.length >= limit) {
    buckets.set(key, hits)
    return { limited: true, retryAfter: Math.ceil((hits[0] + windowMs - now) / 1000) }
  }
  hits.push(now)
  buckets.set(key, hits)
  return { limited: false, retryAfter: 0 }
}

export function tooMany(res, retryAfter) {
  res.statusCode = 429
  res.setHeader('Retry-After', String(retryAfter))
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify({ error: 'Çok fazla istek' }))
}
