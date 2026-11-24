import { useRef, useState } from 'react'
import { buildQuestionPayload, sendWebhook } from '../lib/webhook.js'
import { QUESTION_MIN, QUESTION_MAX } from '../lib/validation.js'
import { askRateLimiter } from '../lib/rateLimiter.js'

// crypto.randomUUID yalnızca güvenli bağlamda (https, localhost) var; yerel ağ IP'sinden açılınca yedeğe düşer.
function newSessionId() {
  if (crypto.randomUUID) return crypto.randomUUID()
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('')
}

// Ziyaretçinin sorusu n8n'deki AI Agent'a gider, yanıt aynı istekte döner.
// sessionId sayfa açık kaldıkça sabit: asistan önceki soruları hatırlar.
export default function AskQuestion() {
  const [sessionId] = useState(newSessionId)
  const [messages, setMessages] = useState([]) // { id, question, answer }
  const [pending, setPending] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  async function handleSubmit(event) {
    event.preventDefault()
    if (pending) return
    const form = event.currentTarget
    const question = new FormData(form).get('question').trim()
    if (question.length < QUESTION_MIN) {
      setError(`Soru en az ${QUESTION_MIN} karakter olmalı.`)
      return
    }
    if (askRateLimiter('ask_submit')) {
      setError('Çok hızlı soru gönderdin. Biraz bekleyip tekrar dene.')
      return
    }

    setError('')
    setPending(question)
    form.reset() // soru baloncukta görünüyor; hata olursa kutuya geri konur
    try {
      const { answer } = await sendWebhook(buildQuestionPayload({ question, sessionId }))
      setMessages((list) => [...list, { id: list.length, question, answer }])
    } catch (err) {
      if (inputRef.current) inputRef.current.value = question
      setError(err.message || 'Bir şeyler ters gitti, lütfen tekrar dene.')
    } finally {
      setPending('')
      inputRef.current?.focus()
    }
  }

  // Enter gönderir, Shift+Enter yeni satır açar.
  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      event.currentTarget.form.requestSubmit()
    }
  }

  return (
    <section className="ask" aria-labelledby="ask-title">
      <h2 id="ask-title">Atölyeye Soru Sor</h2>
      <p className="ask__intro">
        Malzeme, fiyat, stok ya da özel sipariş hakkında merak ettiğini yaz; atölyenin asistanı katalogdan bakıp yanıtlasın.
      </p>

      {(messages.length > 0 || pending) && (
        <ol className="ask__log" aria-live="polite">
          {messages.map((m) => (
            <li key={m.id} className="ask__turn">
              <p className="ask__question">{m.question}</p>
              <p className="ask__answer">{m.answer}</p>
            </li>
          ))}
          {pending && (
            <li className="ask__turn">
              <p className="ask__question">{pending}</p>
              <p className="ask__answer ask__answer--pending">Yanıt hazırlanıyor…</p>
            </li>
          )}
        </ol>
      )}

      <form className="form ask__form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Sorun</span>
          <textarea
            ref={inputRef}
            name="question"
            rows={3}
            required
            minLength={QUESTION_MIN}
            maxLength={QUESTION_MAX}
            placeholder="Örn. Karakalem portreyi kendi fotoğrafımdan yaptırabilir miyim?"
            onKeyDown={handleKeyDown}
          />
          <small>Yanıtları yapay zekâ hazırlar, yanılabilir. Telefon, adres gibi kişisel bilgi yazma.</small>
        </label>
        {error && <p className="form__error" role="alert">{error}</p>}
        <button type="submit" className="btn btn--primary" disabled={Boolean(pending)}>
          {pending ? 'Yanıt bekleniyor…' : 'Soru Sor'}
        </button>
      </form>
    </section>
  )
}
