# JWT + Rate Limiting (Hafta 2)

## Genel Bakış
Sipariş ("Sipariş Ver") ve stok bildirimi ("Haber Ver") formlarına JWT token koruması ve rate limiting eklendi.

### JWT (JSON Web Token)
- **Amaç:** Token replay saldırılarını önlemek, istek gerçekliğini doğrulamak
- **Yer:** Her webhook payload'ında `jwt` alanı
- **İçerik:** `header.payload.signature` formatında
  - Payload: `type` (event türü), `productId`, `iat` (issuance time), `nonce` (unique token ID)
  - Secret: `.env.local` içindeki `VITE_JWT_SECRET`

### Rate Limiting
- **Client tarafı:** Aşırı hızlı istekleri engeller
  - Sipariş: dakikada max 10 istek
  - Stok bildirimi: dakikada max 5 istek
  - Şu anda tarayıcı RAM'inde tutuluyor; sayfayı yenilersen sıfırlanır

### Kod Yapısı
```
src/lib/
├── jwt.js                 # Token generate/decode
├── rateLimiter.js         # Rate limiter fabrikası
└── webhook.js             # buildOrderPayload/buildStockPayload (jwt eklendi)

src/components/
├── useWebhookSubmit.js    # Rate limiting kontrolü
├── OrderForm.jsx          # 'order' rate limiter'ı kullanıyor
└── StockNotifyForm.jsx    # 'stock' rate limiter'ı kullanıyor
```

## Hafta 2: Backend Doğrulaması

Webhook endpoint'ine (backend API route'a) taşındığında, JWT'i doğrula:

### Node.js + Express Örneği

```javascript
// middleware/verifyJwt.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'atolyekart-secret-key-change-in-production-2026';

export function verifyJwt(req, res, next) {
  const { jwt: token } = req.body;
  
  if (!token) {
    return res.status(401).json({ error: 'JWT token eksik' });
  }
  
  try {
    const [headerStr, payloadStr, signatureStr] = token.split('.');
    if (!headerStr || !payloadStr || !signatureStr) {
      return res.status(401).json({ error: 'JWT format hatalı' });
    }
    
    // Payload'ı decode et
    const payload = JSON.parse(Buffer.from(payloadStr, 'base64').toString());
    
    // Expiration kontrolü (300 saniye = 5 dakika)
    const now = Math.floor(Date.now() / 1000);
    if (now - payload.iat > 300) {
      return res.status(401).json({ error: 'JWT süresi dolmuş' });
    }
    
    // Nonce veya diğer validasyon (future: veritabanında saklanabilir)
    req.jwt = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'JWT doğrulama başarısız', detail: err.message });
  }
}

// routes/webhook.js
import express from 'express';
import { verifyJwt } from '../middleware/verifyJwt.js';
import { rateLimit } from 'express-rate-limit';

const router = express.Router();

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 dakika
  max: 20, // Max 20 istek
  keyGenerator: (req) => req.headers['x-forwarded-for'] || req.socket.remoteAddress,
  message: 'Çok fazla webhook isteği, lütfen daha sonra tekrar deneyiniz.',
});

router.post('/webhook', webhookLimiter, verifyJwt, (req, res) => {
  const { event, name, productId, productName, phone, email, quantity, source, jwt: _ } = req.body;
  
  // İsteği işle
  console.log(`[${event}] ${name} (${source}) - Product: ${productName} (${productId})`);
  
  // Webhook processor'a gönder, veritabanına kaydet, vs.
  res.json({ success: true, message: 'Webhook alındı' });
});

export default router;
```

### Rate Limiting (Backend)
`express-rate-limit` paketi ile:
- IP başına sınırla (proxy'nin arkasındaysanız `x-forwarded-for` header'ını kontrol et)
- Dakikada 20 istek (default 10 + 5 stok = 15, biraz margin)

### Alternatif: Redis Rate Limiting
Dağıtılmış sistemler için Redis kullan:

```javascript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from 'redis';

const redisClient = redis.createClient();

const webhookLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'atolyekart:webhook:',
  }),
  windowMs: 60 * 1000,
  max: 20,
});
```

## Security Best Practices

1. **JWT Secret:** Production'da güçlü bir random string kullan
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **HTTPS Only:** Webhook'u HTTPS üzerinden (şu anda: webhook.site sağlamış)

3. **CORS:** Backend'de origin kontrol et:
   ```javascript
   app.use(cors({ origin: 'https://serkanakpolat.github.io' }));
   ```

4. **Signature Doğrulama:** Gerçek HMAC-SHA256 imzası (future)
   ```javascript
   const crypto = require('crypto');
   const signature = crypto.createHmac('sha256', JWT_SECRET)
     .update(`${headerStr}.${payloadStr}`)
     .digest('base64');
   if (signature !== signatureStr) throw new Error('Invalid signature');
   ```

5. **Logging:** Başarısız JWT'leri log et:
   ```javascript
   logger.warn('JWT validation failed', { ip: req.ip, reason: err.message });
   ```

## Testing

```bash
# Test: curl ile JWT payload gönder
curl -X POST https://your-backend.com/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "order_created",
    "name": "Test",
    "productId": "001",
    "productName": "Ahşap Kutu",
    "phone": "05551234567",
    "email": "test@example.com",
    "quantity": 1,
    "source": "test",
    "jwt": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3MjM1MjA1MzAsIm5vbmNlIjoibGtuYzR3eWwiLCJ0eXBlIjoib3JkZXJfY3JlYXRlZCIsInByb2R1Y3RJZCI6IjAwMSJ9.abcd..."
  }'
```

## Env Variables

```bash
# .env.local (frontend)
VITE_JWT_SECRET=atolyekart-secret-key-change-in-production-2026
VITE_WEBHOOK_URL=https://webhook.site/your-unique-id

# .env (backend)
JWT_SECRET=atolyekart-secret-key-change-in-production-2026
REDIS_URL=redis://localhost:6379 # (optional, for distributed rate limiting)
```
