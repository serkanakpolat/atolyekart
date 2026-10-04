import { buildOrderPayload } from '../lib/webhook.js'
import useWebhookSubmit from './useWebhookSubmit.js'

export default function OrderForm({ product, onDone }) {
  const { status, error, handleSubmit } = useWebhookSubmit((fields) => buildOrderPayload(product, fields))

  if (status === 'success') {
    return (
      <div className="form-success" role="status">
        <p><strong>Siparişin alındı.</strong> {product.name} için seni en kısa sürede arayacağız.</p>
        <button type="button" className="btn btn--primary" onClick={onDone}>Tamam</button>
      </div>
    )
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <p className="form__product">{product.name}</p>
      <label className="field">
        <span>Adın Soyadın</span>
        <input name="name" required autoComplete="name" autoFocus />
      </label>
      <label className="field">
        <span>Telefon</span>
        <input name="phone" type="tel" required autoComplete="tel" inputMode="tel" placeholder="05xx xxx xx xx" />
      </label>
      <label className="field">
        <span>E-posta <small>(isteğe bağlı)</small></span>
        <input name="email" type="email" autoComplete="email" />
      </label>
      <label className="field field--short">
        <span>Adet</span>
        <input name="quantity" type="number" min="1" max="10" defaultValue="1" required />
      </label>
      {status === 'error' && <p className="form__error" role="alert">{error}</p>}
      <button type="submit" className="btn btn--primary" disabled={status === 'sending'}>
        {status === 'sending' ? 'Gönderiliyor…' : 'Siparişi Gönder'}
      </button>
    </form>
  )
}
