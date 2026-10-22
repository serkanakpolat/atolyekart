// Basit JWT token oluştur/doğrula (HS256 yerine base64 ile; token replay saldırılarına karşı timestamp+nonce kullanılır)
const SECRET = import.meta.env.VITE_JWT_SECRET || 'default-secret-change-in-production'

function base64Encode(obj) {
  return btoa(JSON.stringify(obj))
}

function base64Decode(str) {
  return JSON.parse(atob(str))
}

export function generateToken(data = {}) {
  const header = { typ: 'JWT', alg: 'HS256' }
  const payload = {
    ...data,
    iat: Math.floor(Date.now() / 1000),
    nonce: Math.random().toString(36).substr(2, 9),
  }
  // Gerçek JWT'de signature hesaplanır; burada tarayıcı tarafı için basit version
  // Server doğrulaması: nonce+iat+SECRET ile imza hesapla, gelen signature'la karşılaştır
  const signature = base64Encode({ secret: SECRET, nonce: payload.nonce, iat: payload.iat })

  return `${base64Encode(header)}.${base64Encode(payload)}.${signature}`
}

export function decodeToken(token) {
  try {
    const [headerStr, payloadStr] = token.split('.')
    const payload = base64Decode(payloadStr)
    return payload
  } catch {
    return null
  }
}

export function isTokenExpired(token, maxAge = 300) {
  const payload = decodeToken(token)
  if (!payload || !payload.iat) return true
  const now = Math.floor(Date.now() / 1000)
  return now - payload.iat > maxAge
}
