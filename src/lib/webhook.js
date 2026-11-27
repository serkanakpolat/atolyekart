// Webhook payload'ları — alan adları ödevdeki sözleşmeyle birebir aynı, değiştirme.
// JWT sunucuda (api/token.js) HMAC-SHA256 ile imzalanır; tarayıcı sırrı hiç görmez.

const SOURCE = 'atolyekart-web'
const API = `${import.meta.env.BASE_URL}api`
const TOO_MANY = 'Çok sık istek gönderildi. Bir dakika bekleyip tekrar dene.'

export function buildOrderPayload(product, { name, phone, email, quantity }) {
  return {
    event: 'order_created',
    name,
    productId: product.id,
    productName: product.name,
    phone,
    email,
    quantity: Number(quantity),
    source: SOURCE,
  }
}

export function buildStockPayload(product, { name, email }) {
  return {
    event: 'stock_notification_requested',
    name,
    productId: product.id,
    productName: product.name,
    email,
    source: SOURCE,
  }
}

// "Soru Sor": ürüne bağlı değil. sessionId ziyaretçi başına sabit (localStorage); n8n'deki Redis hafızası buna göre tutulur.
export function buildQuestionPayload({ question, sessionId }) {
  return {
    event: 'question_asked',
    question: question.trim(),
    sessionId,
    source: SOURCE,
  }
}

const INVALID = {
  question_asked: 'Soru 3–500 karakter arasında olmalı.',
  default: 'Bilgilerden biri geçersiz görünüyor; telefon ve e-postayı kontrol edip tekrar dene.',
}

// Sunucunun JSON yanıtını döner (soru için { ok, answer }).
export async function sendWebhook(payload) {
  try {
    const params = new URLSearchParams({ type: payload.event })
    if (payload.productId !== undefined) params.set('productId', String(payload.productId))
    const tokenRes = await fetch(`${API}/token?${params}`)
    if (tokenRes.status === 429) throw new Error(TOO_MANY)
    if (!tokenRes.ok) throw new Error('Sunucuya ulaşılamadı. Biraz sonra tekrar dene.')
    const { token } = await tokenRes.json()

    const res = await fetch(`${API}/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, jwt: token }),
    })
    if (res.status === 429) throw new Error(TOO_MANY)
    if (res.status === 400) throw new Error(INVALID[payload.event] || INVALID.default)
    if (res.status === 502) throw new Error('Şu an yanıt veremedim. Biraz sonra tekrar sorar mısın?')
    if (!res.ok) throw new Error('Sunucu isteği kabul etmedi. Sayfayı yenileyip tekrar dene.')
    return await res.json().catch(() => ({}))
  } catch (err) {
    if (err instanceof TypeError) throw new Error('Gönderilemedi. İnternet bağlantını kontrol edip tekrar dene.')
    throw err
  }
}
