import { useState } from 'react'
import { sendWebhook } from '../lib/webhook.js'
import { orderRateLimiter, stockRateLimiter } from '../lib/rateLimiter.js'

// İki formun ortak gönderim durumu: idle → sending → success | error
// Rate limiting: order + stock requests ayırıca sınırlanır
export default function useWebhookSubmit(buildPayload, rateLimiterKey = 'default') {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()

    // Rate limiting kontrolü
    const isLimited = rateLimiterKey === 'order'
      ? orderRateLimiter('order_submit')
      : rateLimiterKey === 'stock'
      ? stockRateLimiter('stock_submit')
      : false

    if (isLimited) {
      setError('Çok hızlı istekte bulundunuz. Lütfen birkaç saniye bekleyin.')
      setStatus('error')
      return
    }

    const fields = Object.fromEntries(new FormData(event.currentTarget))
    setStatus('sending')
    setError('')
    try {
      await sendWebhook(buildPayload(fields))
      setStatus('success')
    } catch (err) {
      setError(err.message || 'Bir şeyler ters gitti, lütfen tekrar dene.')
      setStatus('error')
    }
  }

  return { status, error, handleSubmit }
}
