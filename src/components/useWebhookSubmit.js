import { useState } from 'react'
import { sendWebhook } from '../lib/webhook.js'

// İki formun ortak gönderim durumu: idle → sending → success | error
export default function useWebhookSubmit(buildPayload) {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
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
