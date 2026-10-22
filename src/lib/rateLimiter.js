// Rate limiter — tarayıcı tarafında istek frekansını sınırla.
// Pattern: key başına (ör. 'order_submit') son istek zamanlarını (timestamp array'i) sakla.
// Dakikada max N istek: son 60 saniyedeki istek sayısı < N ise yeni isteğe izin ver.

const requestLog = new Map() // key → [timestamp1, timestamp2, ...]

export function createRateLimiter(maxRequests, windowSeconds = 60) {
  return function isRateLimited(key) {
    const now = Date.now()
    const cutoff = now - windowSeconds * 1000

    if (!requestLog.has(key)) {
      requestLog.set(key, [])
    }

    const times = requestLog.get(key)
    // Eski istek zamanlarını sil (window'ın dışında)
    const recentTimes = times.filter((t) => t > cutoff)
    requestLog.set(key, recentTimes)

    // Limit aşıldı mı?
    if (recentTimes.length >= maxRequests) {
      return true // rate limited
    }

    // Yeni isteği log et
    recentTimes.push(now)
    return false // izin ver
  }
}

// Örnek: dakikada 10 order request'i
export const orderRateLimiter = createRateLimiter(10, 60)

// Örnek: dakikada 5 stock notification request'i
export const stockRateLimiter = createRateLimiter(5, 60)
