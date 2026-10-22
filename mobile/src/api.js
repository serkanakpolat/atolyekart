// Web'deki src/lib/webhook.js ile aynı sözleşme ve akış: önce sunucu imzalı token, sonra POST.
// Telefon bilgisayarın localhost'una erişemediği için canlı Vercel backend'i kullanılır.
export const SITE_URL = 'https://atolyekart-rose.vercel.app'
const API = `${SITE_URL}/api`
const SOURCE = 'atolyekart-web'
const TOO_MANY = 'Çok sık istek gönderildi. Bir dakika bekleyip tekrar dene.'

export function imageUrl(path) {
  return SITE_URL + encodeURI(path)
}

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

export async function sendWebhook(payload) {
  let tokenRes, res
  try {
    const query = `type=${encodeURIComponent(payload.event)}&productId=${encodeURIComponent(payload.productId)}`
    tokenRes = await fetch(`${API}/token?${query}`)
    if (tokenRes.status === 429) throw new Error(TOO_MANY)
    if (!tokenRes.ok) throw new Error('Sunucuya ulaşılamadı. Biraz sonra tekrar dene.')
    const { token } = await tokenRes.json()

    res = await fetch(`${API}/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, jwt: token }),
    })
  } catch (err) {
    if (err instanceof TypeError) throw new Error('Gönderilemedi. İnternet bağlantını kontrol edip tekrar dene.')
    throw err
  }
  if (res.status === 429) throw new Error(TOO_MANY)
  if (res.status === 400) throw new Error('Bilgilerden biri geçersiz görünüyor; telefon ve e-postayı kontrol edip tekrar dene.')
  if (!res.ok) throw new Error('Sunucu isteği kabul etmedi. Tekrar dene.')
}
