// Webhook payload'ları — alan adları ödevdeki sözleşmeyle birebir aynı, değiştirme.
// Hafta 1: doğrudan webhook.site'a gönderilir. Secret koruma / backend Hafta 2'de.
// Hafta 2: JWT + Rate Limiting eklendi.

import { generateToken } from './jwt.js'

const SOURCE = 'atolyekart-web'

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
    jwt: generateToken({ type: 'order_created', productId: product.id }),
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
    jwt: generateToken({ type: 'stock_notification_requested', productId: product.id }),
  }
}

export async function sendWebhook(payload) {
  const url = import.meta.env.VITE_WEBHOOK_URL
  if (!url) {
    throw new Error('Webhook adresi tanımlı değil (.env.local içinde VITE_WEBHOOK_URL).')
  }
  // webhook.site cevabına CORS başlığı koymuyor; tarayıcı cevabı okumamıza izin vermez.
  // no-cors: istek yine gider, cevap okunamaz (durum kodu bilinmez). Ağ hatası yine yakalanır.
  // Hafta 2'de backend/API route'a taşınınca normal fetch + cevap kontrolüne dönülecek.
  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error('Gönderilemedi. İnternet bağlantını kontrol edip tekrar dene.')
  }
}
