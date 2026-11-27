import { useEffect, useRef, useState } from 'react'
import { buildQuestionPayload, sendWebhook } from '../lib/webhook.js'
import { QUESTION_MIN, QUESTION_MAX } from '../lib/validation.js'
import { askRateLimiter } from '../lib/rateLimiter.js'

// Ziyaretçi kimliği ve görünen yazışma tarayıcıda saklanır; asistanın hafızası n8n'de Redis'te,
// aynı kimlikle 30 gün durur. Süre dolunca ikisi birlikte sıfırlanır ki ekranla hafıza ayrışmasın.
const VISITOR_KEY = 'atolyekart_ziyaretci'
const HISTORY_KEY = 'atolyekart_sohbet'
const HISTORY_MAX = 20
const HISTORY_TTL_MS = 30 * 24 * 60 * 60 * 1000

// crypto.randomUUID yalnızca güvenli bağlamda (https, localhost) var; yerel ağ IP'sinden açılınca yedeğe düşer.
function newSessionId() {
  if (crypto.randomUUID) return crypto.randomUUID()
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('')
}

// Gizli pencere ya da kapalı site verisinde localStorage hata verebilir; o zaman sohbet yalnızca bu sayfada kalır.
function readStorage(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key, value) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // saklanamazsa sohbet sayfa açıkken yine çalışır
  }
}

function loadHistory() {
  try {
    const saved = JSON.parse(readStorage(HISTORY_KEY) || 'null')
    if (saved && Array.isArray(saved.messages) && Date.now() - saved.at < HISTORY_TTL_MS) return saved.messages
  } catch {
    // bozuk kayıt: yeni sohbetle devam
  }
  writeStorage(HISTORY_KEY, null)
  writeStorage(VISITOR_KEY, null)
  return []
}

function loadVisitorId() {
  const saved = readStorage(VISITOR_KEY)
  if (saved) return saved
  const id = newSessionId()
  writeStorage(VISITOR_KEY, id)
  return id
}

// Ziyaretçinin sorusu n8n'deki AI Agent'a gider, yanıt aynı istekte döner.
// sessionId ziyaretçi başına sabit: sayfa yenilense ya da ziyaretçi sonra dönse de asistan önceki mesajları hatırlar.
export default function AskQuestion() {
  const [messages, setMessages] = useState(loadHistory) // { id, question, answer }; kimlikten önce okunur
  const [sessionId, setSessionId] = useState(loadVisitorId)
  const [pending, setPending] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (messages.length) writeStorage(HISTORY_KEY, JSON.stringify({ at: Date.now(), messages: messages.slice(-HISTORY_MAX) }))
  }, [messages])

  function startNewChat() {
    const id = newSessionId()
    writeStorage(VISITOR_KEY, id)
    writeStorage(HISTORY_KEY, null)
    setSessionId(id)
    setMessages([])
    setError('')
    inputRef.current?.focus()
  }

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
      setMessages((list) => [...list, { id: Date.now(), question, answer }])
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
          <small>
            Yanıtları yapay zekâ hazırlar, yanılabilir. Sohbetin bu tarayıcıda ve atölyenin sunucusunda 30 gün
            saklanır; telefon, adres gibi kişisel bilgi yazma.
          </small>
        </label>
        {error && <p className="form__error" role="alert">{error}</p>}
        <div className="ask__actions">
          <button type="submit" className="btn btn--primary" disabled={Boolean(pending)}>
            {pending ? 'Yanıt bekleniyor…' : 'Soru Sor'}
          </button>
          {messages.length > 0 && !pending && (
            <button type="button" className="btn btn--secondary" onClick={startNewChat}>
              Yeni sohbet
            </button>
          )}
        </div>
      </form>
    </section>
  )
}
