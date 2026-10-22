---
name: atolyekart-webhook-formati
description: AtölyeKart webhook payload sözleşmesi ve gönderim kuralları — sipariş, stok bildirimi ya da yeni bir form/webhook eklerken, payload alanlarını değiştirirken, api/webhook.js backend'ini düzenlerken veya gönderimi test ederken kullan.
---

# AtölyeKart webhook formatı

Webhook'lar eğitmenin verdiği **veri sözleşmesine** uyar. Alan adları, sırası ve türleri değişmez; yeni alan gerekiyorsa önce kullanıcıya sor.

## Sözleşme

### Sipariş — `event: "order_created"`
| Alan | Tür | Kaynak |
|---|---|---|
| `event` | string | sabit `"order_created"` |
| `name` | string | form, zorunlu |
| `productId` | string | `product.id` |
| `productName` | string | `product.name` |
| `phone` | string | form, zorunlu |
| `email` | string | form, isteğe bağlı (boşsa `""`) |
| `quantity` | number | form, ≥1, `Number()` ile çevrilir |
| `source` | string | sabit `"atolyekart-web"` |

### Stok bildirimi — `event: "stock_notification_requested"`
| Alan | Tür | Kaynak |
|---|---|---|
| `event` | string | sabit `"stock_notification_requested"` |
| `name` | string | form, zorunlu |
| `productId` | string | `product.id` |
| `productName` | string | `product.name` |
| `email` | string | form, zorunlu |
| `source` | string | sabit `"atolyekart-web"` |

Örnek:
```json
{ "event": "order_created", "name": "Ayşe", "productId": "algi-karakalem-seti",
  "productName": "Algı — İkili Karakalem Seti", "phone": "05551112233",
  "email": "", "quantity": 1, "source": "atolyekart-web" }
```

## Kod kuralları
- Payload'lar **yalnızca** `src/lib/webhook.js` içindeki kurucularla oluşturulur (`buildOrderPayload`, `buildStockPayload`). Bileşenlerde elle obje kurma.
- Yeni webhook türü: yeni bir `buildXxxPayload` + aynı `source`, olay adı `nesne_gecmis_zaman` biçiminde (ör. `order_created`).
- Gönderim `sendWebhook(payload)` ile; formlar `useWebhookSubmit` hook'unu kullanır (idle → sending → success | error).
- Hedef kendi backend'imiz: `sendWebhook` önce `GET /api/token?type=<event>&productId=<id>` ile sunucu imzalı (HMAC-SHA256) token alır, payload'a `jwt` olarak ekleyip `POST /api/webhook`'a gönderir ve `res.ok` kontrol eder.
- Harici webhook servisi (webhook.site vb.) kullanılmaz. Sır `JWT_SECRET` yalnızca sunucuda; `VITE_` ile başlayan değişkenler tarayıcı paketine girer, sır asla `VITE_` ile tanımlanmaz.

## Test
1. `.env.local` değiştiyse dev sunucusunu yeniden başlat.
2. İki formu da gönder; `npm run dev` terminalinde ve http://localhost:5173/api/webhook listesinde iki ayrı istek ve alanların tabloyla birebir aynı olduğunu doğrula (canlıda: Vercel Logs).
3. Fazla ya da eksik alan, string'e dönüşmüş `quantity` → hata say.
