# JWT + Rate Limiting

Sipariş ("Sipariş Ver") ve stok bildirimi ("Haber Ver") formları sunucu imzalı JWT ile korunur; istemcide ayrıca hız sınırı vardır.

## Akış

1. Form gönderilince `src/lib/webhook.js` → `GET /api/token?type=<event>&productId=<id>`
2. `api/token.js` HS256 (HMAC-SHA256) ile imzalı token döner.
3. İstemci payload'a `jwt` alanını ekleyip `POST /api/webhook`'a gönderir.
4. `api/webhook.js` token'ı doğrular; geçerliyse `200`, değilse `401` döner ve isteği loglar.

Sır (`JWT_SECRET`) yalnızca sunucudadır; tarayıcı paketine girmez. **Sır asla `VITE_` önekiyle tanımlanmaz**, çünkü `VITE_` değişkenleri istemci koduna gömülür.

## JWT

- Biçim: standart `base64url(header).base64url(payload).base64url(HMAC-SHA256)`
- Payload: `type` (olay), `productId`, `iat`, `exp` (iat + 300 sn), `nonce` (rastgele 12 bayt)
- Kod: `api/_jwt.js` (`_` ile başladığı için Vercel bunu route yapmaz)

Doğrulama (`verifyToken`), sırasıyla:

| Kontrol | Hata |
|---|---|
| 3 parçalı mı | `jwt biçimi hatalı` |
| İmza (sabit zamanlı `timingSafeEqual`) | `jwt imzası geçersiz` |
| Süre (`exp`) | `jwt süresi dolmuş` |
| `type`/`productId` istekle aynı mı | `jwt bu istek için değil` |
| `nonce` daha önce kullanıldı mı | `jwt daha önce kullanılmış` |

Not: kullanılmış nonce listesi fonksiyon belleğinde tutulur. Vercel'de eşzamanlı iki fonksiyon kopyası birbirinin listesini görmez; 5 dakikalık süre sınırı riski daraltır. Kesin koruma için ortak bir depo (ör. Redis) gerekir.

## Rate limiting

- İstemci tarafı (`src/lib/rateLimiter.js`, `useWebhookSubmit.js`): sipariş dakikada 10, stok bildirimi dakikada 5 istek.
- Tarayıcı belleğinde tutulur, sayfa yenilenince sıfırlanır; yalnızca yanlışlıkla çift tıklamayı önler, saldırıya karşı koruma değildir.
- Sunucu tarafı (`api/_rateLimit.js`): IP başına kayan pencere — `/api/token` dakikada 20, `/api/webhook` dakikada 10 istek; aşılınca `429` + `Retry-After`. Sayaç fonksiyon belleğindedir, yani her Vercel fonksiyon kopyası için ayrıdır; dağıtık kesin sınır için Redis gerekir.

## Sunucu doğrulaması

`api/_validate.js`, token kontrolünden önce çalışır; hata varsa `400` döner ve loglanır:

- Alan listesi sözleşmeyle birebir aynı olmalı (eksik ya da fazla alan reddedilir); `source` = `atolyekart-web`
- `productId` `src/data/products.js`'te olmalı, `productName` onunla eşleşmeli
- Sipariş yalnızca stoktaki ürüne, stok bildirimi yalnızca tükenmiş ürüne
- `name` 2–80 karakter, `<>{}\` ve kontrol karakteri yok
- `phone` Türkiye cep numarası (`05xx…`, `+905xx…`; boşluk/tire/parantez yok sayılır)
- `quantity` 1–10 arası tam sayı (string kabul edilmez)
- `email` istemciyle aynı desen; siparişte boş olabilir, stok bildiriminde zorunlu
- Gövde en fazla 8 KB

## Ortam değişkenleri

| Değişken | Nerede | Not |
|---|---|---|
| `JWT_SECRET` | `.env.local`, Vercel (production + preview, sensitive) | En az 32 karakter; yoksa API `500` döner |

Yeni sır üretmek:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Sırrı değiştirirsen hem `.env.local`'ı hem Vercel'i güncelle ve yeniden deploy et.

## Gelen istekleri görmek

- Yerelde: `npm run dev` terminali (`[webhook] order_created — … — jwt: geçerli`) ve http://localhost:5173/api/webhook (son 50 istek).
- Canlıda: Vercel → atolyekart → **Logs**. `GET /api/webhook` canlıda kapalıdır (müşteri bilgisi içerir).
- İstekler kalıcı olarak saklanmaz; loglar birkaç gün sonra silinir.

## Test

```bash
# Token al ve sipariş gönder (yerel)
TOKEN=$(curl -s "http://localhost:5173/api/token?type=order_created&productId=test" | node -pe "JSON.parse(require('fs').readFileSync(0)).token")
curl -X POST http://localhost:5173/api/webhook -H "Content-Type: application/json" \
  -d "{\"event\":\"order_created\",\"name\":\"Test\",\"productId\":\"test\",\"productName\":\"Deneme\",\"phone\":\"05551234567\",\"email\":\"\",\"quantity\":1,\"source\":\"atolyekart-web\",\"jwt\":\"$TOKEN\"}"
# Aynı komutu tekrar çalıştır → 401 "jwt daha önce kullanılmış"
```
