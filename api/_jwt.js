// HS256 JWT: yalnızca sunucuda imzalanır ve doğrulanır; sır tarayıcıya hiç gitmez.
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

export const TOKEN_TTL = 300
const usedNonces = new Map()

function b64url(input) {
  return Buffer.from(input).toString('base64url')
}

function getSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET tanımlı değil ya da 32 karakterden kısa')
  return secret
}

function sign(data) {
  return createHmac('sha256', getSecret()).update(data).digest('base64url')
}

export function issueToken(claims) {
  const now = Math.floor(Date.now() / 1000)
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = b64url(JSON.stringify({ ...claims, iat: now, exp: now + TOKEN_TTL, nonce: randomBytes(12).toString('hex') }))
  return `${header}.${payload}.${sign(`${header}.${payload}`)}`
}

// Hata mesajı döner; token geçerliyse null.
export function verifyToken(token, expected) {
  if (typeof token !== 'string') return 'jwt eksik'
  const parts = token.split('.')
  if (parts.length !== 3) return 'jwt biçimi hatalı'
  const [header, payload, signature] = parts

  const actual = Buffer.from(signature)
  const wanted = Buffer.from(sign(`${header}.${payload}`))
  if (actual.length !== wanted.length || !timingSafeEqual(actual, wanted)) return 'jwt imzası geçersiz'

  let claims
  try {
    claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  } catch {
    return 'jwt çözülemedi'
  }

  const now = Math.floor(Date.now() / 1000)
  if (typeof claims.exp !== 'number' || claims.exp < now) return 'jwt süresi dolmuş'
  if (claims.type !== expected.type || claims.productId !== expected.productId) return 'jwt bu istek için değil'

  for (const [nonce, exp] of usedNonces) if (exp < now) usedNonces.delete(nonce)
  if (usedNonces.has(claims.nonce)) return 'jwt daha önce kullanılmış'
  usedNonces.set(claims.nonce, claims.exp)
  return null
}
