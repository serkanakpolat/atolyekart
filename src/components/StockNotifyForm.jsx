import { buildStockPayload } from '../lib/webhook.js'
import { EMAIL_PATTERN, EMAIL_HINT } from '../lib/validation.js'
import useWebhookSubmit from './useWebhookSubmit.js'
import ConsentCheckbox from './ConsentCheckbox.jsx'

export default function StockNotifyForm({ product, onDone }) {
  const { status, error, handleSubmit } = useWebhookSubmit((fields) => buildStockPayload(product, fields), 'stock')

  if (status === 'success') {
    return (
      <div className="form-success" role="status">
        <p><strong>Kaydın alındı.</strong> {product.name} yeniden hazır olduğunda sana e-posta ile haber vereceğiz.</p>
        <button type="button" className="btn btn--primary" onClick={onDone}>Tamam</button>
      </div>
    )
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <p className="form__product">
        {product.name} şu an tükendi. Yenisi atölyeden çıkınca ilk sen öğren.
      </p>
      <label className="field">
        <span>Adın Soyadın</span>
        <input name="name" required autoComplete="name" autoFocus />
      </label>
      <label className="field">
        <span>E-posta</span>
        <input name="email" type="email" required autoComplete="email" pattern={EMAIL_PATTERN} title={EMAIL_HINT} />
      </label>
      <ConsentCheckbox dataList="Ad soyad ve e-posta" />
      {status === 'error' && <p className="form__error" role="alert">{error}</p>}
      <button type="submit" className="btn btn--primary" disabled={status === 'sending'}>
        {status === 'sending' ? 'Gönderiliyor…' : 'Haber Ver'}
      </button>
    </form>
  )
}
