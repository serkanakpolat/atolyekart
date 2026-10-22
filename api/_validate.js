// Sunucu tarafı payload doğrulaması: istemci kontrolleri atlatılabilir, son söz burada.
import { products } from '../src/data/products.js'
import { EMAIL_PATTERN } from '../src/lib/validation.js'

const SOURCE = 'atolyekart-web'
const EMAIL = new RegExp(`^${EMAIL_PATTERN}$`)
const PHONE = /^(\+90|0)?5\d{9}$/

const FIELDS = {
  order_created: ['event', 'name', 'productId', 'productName', 'phone', 'email', 'quantity', 'source', 'jwt'],
  stock_notification_requested: ['event', 'name', 'productId', 'productName', 'email', 'source', 'jwt'],
}

function checkName(name) {
  if (typeof name !== 'string') return 'ad eksik'
  const trimmed = name.trim()
  if (trimmed.length < 2 || trimmed.length > 80) return 'ad 2–80 karakter olmalı'
  if (/[<>{}\\]|[\u0000-\u001f]/.test(trimmed)) return 'ad geçersiz karakter içeriyor'
  return null
}

function checkEmail(email, required) {
  if (email === '' && !required) return null
  if (typeof email !== 'string' || email.length > 254 || !EMAIL.test(email)) return 'e-posta geçersiz'
  return null
}

// Hata mesajı döner; payload geçerliyse null.
export function validatePayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'gövde nesne olmalı'

  const allowed = FIELDS[body.event]
  if (!allowed) return 'bilinmeyen olay'
  const keys = Object.keys(body)
  const extra = keys.filter((k) => !allowed.includes(k))
  if (extra.length) return `beklenmeyen alan: ${extra.join(', ')}`
  const missing = allowed.filter((k) => !(k in body))
  if (missing.length) return `eksik alan: ${missing.join(', ')}`

  if (body.source !== SOURCE) return 'source geçersiz'

  const product = products.find((p) => p.id === body.productId)
  if (!product) return 'ürün bulunamadı'
  if (body.productName !== product.name) return 'ürün adı eşleşmiyor'

  const nameError = checkName(body.name)
  if (nameError) return nameError

  if (body.event === 'order_created') {
    if (!product.inStock) return 'ürün stokta yok'
    if (typeof body.phone !== 'string' || !PHONE.test(body.phone.replace(/[\s()-]/g, ''))) return 'telefon geçersiz'
    if (!Number.isInteger(body.quantity) || body.quantity < 1 || body.quantity > 10) return 'adet 1–10 arası tam sayı olmalı'
    return checkEmail(body.email, false)
  }

  if (product.inStock) return 'ürün zaten stokta'
  return checkEmail(body.email, true)
}
