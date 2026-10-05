---
name: atolyekart-webhook-formati
description: AtölyeKart webhook payload sözleşmesi ve gönderim kuralları — sipariş, stok bildirimi ya da yeni bir form/webhook eklerken, payload alanlarını değiştirirken, webhook.site testi yaparken veya webhook'u backend'e taşırken kullan.
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
- URL koda yazılmaz: `.env.local` → `VITE_WEBHOOK_URL`. `.env.local` git'e girmez.

## Hafta 1 kısıtları
- Tarayıcıdan doğrudan webhook.site'a gidilir. webhook.site CORS başlığı göndermediği için `mode: 'no-cors'` + `Content-Type: text/plain` kullanılır: istek gider, cevap okunamaz. Ağ hatası yine yakalanır.
- `VITE_` ile başlayan değişkenler tarayıcı paketine girer — gizli değildir. Secret koruma ve backend/API route'a taşıma **Hafta 2**'de; o zaman `no-cors` kalkar ve cevap durumu kontrol edilir.

## Test
1. `.env.local` değiştiyse dev sunucusunu yeniden başlat.
2. İki formu da gönder; webhook.site'ta iki ayrı istek ve alanların tabloyla birebir aynı olduğunu doğrula.
3. Fazla ya da eksik alan, string'e dönüşmüş `quantity` → hata say.
