/**
 * Hafta 2 örneği: Node.js + Express webhook endpoint'i
 * JWT doğrulama ve rate limiting ile
 *
 * Kurulum:
 * npm install express jsonwebtoken express-rate-limit
 *
 * Kullanım:
 * import webhookRouter from './routes/webhook.js';
 * app.use('/api', webhookRouter);
 */

import express from 'express';
import rateLimit from 'express-rate-limit';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'atolyekart-secret-key-change-in-production-2026';

// ===== Rate Limiting Middleware =====
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 dakika
  max: 20, // Dakikada max 20 webhook isteği
  keyGenerator: (req) => req.headers['x-forwarded-for'] || req.socket.remoteAddress,
  message: 'Çok fazla webhook isteği. Lütfen daha sonra tekrar deneyiniz.',
  standardHeaders: true,
  legacyHeaders: false,
});

// ===== JWT Doğrulama Middleware =====
function verifyJwt(req, res, next) {
  const { jwt: token } = req.body;

  if (!token) {
    return res.status(401).json({
      error: 'JWT token eksik',
      code: 'MISSING_JWT',
    });
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('JWT format hatalı (3 parça gerekli)');
    }

    const [headerStr, payloadStr, signatureStr] = parts;

    // Base64 decode
    const payload = JSON.parse(
      Buffer.from(payloadStr, 'base64').toString('utf-8')
    );

    // Expiration kontrolü (5 dakika = 300 saniye)
    const now = Math.floor(Date.now() / 1000);
    const age = now - payload.iat;
    if (age > 300) {
      return res.status(401).json({
        error: `JWT süresi dolmuş (${age}s > 300s)`,
        code: 'JWT_EXPIRED',
      });
    }

    if (age < -60) {
      // Future timestamp (clock skew tolerated: 60 saniye)
      return res.status(401).json({
        error: 'JWT oluş zamanı gelecekte',
        code: 'JWT_FUTURE',
      });
    }

    // Nonce ve tip kontrolü (future: nonce'ları DB'de track et)
    if (!payload.nonce || !payload.type) {
      return res.status(401).json({
        error: 'JWT payload eksik alanlar (nonce, type gerekli)',
        code: 'JWT_INVALID_PAYLOAD',
      });
    }

    // İsteğe attach et
    req.jwtPayload = payload;
    next();
  } catch (err) {
    return res.status(401).json({
      error: `JWT doğrulama başarısız: ${err.message}`,
      code: 'JWT_VERIFICATION_FAILED',
    });
  }
}

// ===== Webhook Endpoint =====
router.post('/webhook', webhookLimiter, verifyJwt, (req, res) => {
  const {
    event,
    name,
    productId,
    productName,
    phone,
    email,
    quantity,
    source,
    // jwt is already verified in middleware, removed from destructure
  } = req.body;

  const jwtPayload = req.jwtPayload;

  // Validasyon
  if (!event || !name || !productId) {
    return res.status(400).json({
      error: 'Gerekli alanlar eksik (event, name, productId)',
      code: 'MISSING_FIELDS',
    });
  }

  // Event türü kontrolü
  if (!['order_created', 'stock_notification_requested'].includes(event)) {
    return res.status(400).json({
      error: `Geçersiz event türü: ${event}`,
      code: 'INVALID_EVENT_TYPE',
    });
  }

  // JWT'de bildirilen event türü request body'dekiyle eşleş mi?
  if (jwtPayload.type !== event) {
    return res.status(400).json({
      error: `JWT type mismatch: ${jwtPayload.type} !== ${event}`,
      code: 'JWT_TYPE_MISMATCH',
    });
  }

  // JWT'de productId eşleş mi?
  if (jwtPayload.productId !== productId) {
    return res.status(400).json({
      error: `JWT productId mismatch: ${jwtPayload.productId} !== ${productId}`,
      code: 'JWT_PRODUCT_MISMATCH',
    });
  }

  // Log
  console.log(`[${new Date().toISOString()}] ${event}`, {
    name,
    productId,
    productName,
    phone,
    email,
    quantity: quantity || 'N/A',
    source,
    ipAddress: req.ip,
    jwtNonce: jwtPayload.nonce,
  });

  // TODO: Veritabanına kaydet, email gönder, vs.
  // const order = await Order.create({ event, name, productId, ... });
  // await sendEmailNotification(order);

  res.json({
    success: true,
    message: `${event} başarıyla alındı`,
    data: {
      id: `evt_${Date.now()}`, // Fake event ID
      status: 'received',
    },
  });
});

// ===== Health Check =====
router.get('/webhook/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
