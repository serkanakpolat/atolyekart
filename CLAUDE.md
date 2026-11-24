# AtölyeKart — Ahşap ve Karakalem Atölyesi

BizCard'a paralel ilerleyen ikinci proje: el yapımı ürün satan bir atölyenin web sitesi.

## Atölye
- **Ad:** Ahşap ve Karakalem Atölyesi
- **Sektör:** El sanatları — ahşap oymacılığı ve resim (karakalem)
- **Ton:** Sıcak, samimi, zanaata saygılı. Abartılı pazarlama dili yok; malzemeyi ve emeği anlat.
- **Dil:** Arayüz ve içerik Türkçe. Fiyatlar Türk lirası (örn. `1.500 ₺`; ahşap 1.500 ₺, karakalem 750 ₺).

## Hedef kitle
- El yapımı, tek ürün (seri üretim olmayan) dekorasyon arayan 28–55 yaş arası kişiler
- Anlamlı hediye arayanlar (düğün, yeni ev, yıl dönümü)
- Özel sipariş (isim/motif oyma, portre resim) isteyen müşteriler

## Ürün kategorileri
- **Ahşap Oyma:** mücevher/hediye kutuları, duvar panoları, kaşık-kepçe, çerçeveler
- **Resim:** karakalem çalışmalar
- **Özel Sipariş:** kişiye özel oyma veya resim

## Ürün veri alanları
`id`, `name`, `category`, `price` (sayı, TL), `description`, `image`, `inStock` (bool)

## Teknik
- Hafta 1: önce düz HTML (`html/index.html`, referans olarak saklanıyor), sonra React'e geçiş.
- Vite + React. Çalıştırma: `npm run dev` → http://localhost:5173
- Yapı: ürün verisi `src/data/products.js`; bileşenler `src/components/` (ProductList → ProductCard → ProductImage); stiller `src/index.css`.
- Ürün görselleri `public/urunresimleri/` içinde, kodda `/urunresimleri/...` yoluyla.
- Seçili ürün + açık form durumu `App.jsx`'te (`activeForm`); `onOrder`/`onNotify` App → ProductList → ProductCard prop'larla iner. Formlar `FormDialog` (native `<dialog>`) içinde: `OrderForm`, `StockNotifyForm`.
- Yayın: GitHub Pages → https://serkanakpolat.github.io/atolyekart/ (repo: serkanakpolat/atolyekart). `npm run deploy` yerelde build alıp `gh-pages` dalına gönderir; `.env.local` build'e gömülür. Build'de Vite `base` = `/atolyekart/`, görseller `import.meta.env.BASE_URL` ile çözülür.
- Webhook: payload kurucuları ve gönderim `src/lib/webhook.js`'te. İstemci önce `/api/token`'dan sunucu imzalı JWT alır, sonra `/api/webhook`'a POST eder (Vercel fonksiyonları `api/`; yerelde `vite.config.js` aynı handler'ları middleware olarak bağlar). Sır `JWT_SECRET` yalnızca sunucuda (`.env.local` ve Vercel env; `VITE_` öneki yok). Harici webhook servisi yok; gelen istekler yerelde terminalde ve `GET /api/webhook`'ta, canlıda Vercel Logs'ta görünür. `productId`/`productName` ürünün `id`/`name` alanından gelir.
- n8n (Hafta 3): `api/webhook.js` doğrulanmış `order_created` isteklerini (jwt hariç) `N8N_WEBHOOK_URL`'e iletir; adres yalnızca sunucuda (`.env.local` / Vercel env), path tahmin edilemez olduğu için gizli tutulur. Akış n8n Cloud'da (ryazici.app.n8n.cloud, workflow "AtölyeKart — Sipariş → Sheet + AI Teşekkür Maili"): Webhook → Sheet'e sipariş satırı ("AtölyeKart Siparişler" e-tablosu) → Gemini (`gemini-3.5-flash`) ile teşekkür + tahmini süre maili → aynı satıra yazma. Mail gönderilmez, yalnızca taslak. Yerel Docker n8n bu projede kullanılmaz.
- n8n (Hafta 4): `stock_notification_requested` istekleri `N8N_STOCK_WEBHOOK_URL`'e gider (yine yalnızca sunucuda). n8n ürün bilgisini `GET /api/products`'tan okur (`src/data/products.js`'in görselsiz kopyası). Akışlar: "Ortak Doğrulama (Sub-workflow)" (e-posta biçimi + ürün ID katalog kontrolü, geçersizse Stop and Error) — sipariş ve stok akışlarının ikisi de çağırır; "Hata Yakalayıcı (Error Handler)" iki ana akışın Error Workflow'u, hataları Sheet'in "Hatalar" sekmesine yazar; "Stok Bildirimi → AI Alternatif Öneri" (AI Agent + `urun_katalogu` HTTP aracı → "Stok Talepleri"); "Günlük Sipariş Özeti" (her gün 21:00, Code ile ürüne göre gruplama → Merge ile katalog → Loop → "Günlük Özet"). n8n 2.x'te kaydetmek yetmez, akış yayınlanmalı (Publish). Google Sheets append node'larında "Minimise API Calls" (`useAppend`) açık kalmalı; kapalıyken eşzamanlı execution'lar aynı satırın üstüne yazıyor.
- n8n (Soru Sor): sayfadaki `AskQuestion` bölümü `question_asked` gönderir; `api/webhook.js` bunu `N8N_ASK_WEBHOOK_URL`'e iletip yanıtı **bekler** (60 sn) ve `{ ok, answer }` döner. Token'da productId boş. Akış "AtölyeKart — Soru Sor → AI Agent": Webhook (Respond: using Respond to Webhook node) → Execution Data (soru/oturum) + Ürün Kataloğunu Al → AI Agent (Gemini, Simple Memory `sessionId` ile, katalog system prompt'ta) → Respond to Webhook `{ answer }`. Katalog araç (tool) yerine prompt'ta: araç çağrısı ikinci bir Gemini çağrısı demek, yanıtı 30–60 sn'ye çıkarıyordu. Gemini düşünme token'ları `maxOutputTokens`'tan düşer; 1024'te yanıt kesiliyordu (4096).
- n8n (RAG): Soru Sor Agent'ının modeli artık Claude Haiku 5.5 (`claude-haiku-5-5`, adaptive thinking effort `low`, maxTokens 8192; Haiku 5.5 varsayılan dışı temperature'ı reddeder, ayarlama). SSS bilgi bankası: "AtölyeKart — SSS Bilgi Bankası Yükleme (RAG)" akışı (n8n Form ile .txt yüklenir → numaralı "N - Soru" başlıklarından soru-cevaplara ayrılır → Gemini `gemini-embedding-001` → Simple Vector Store `atolyekart_sss`, her yüklemede eskisi silinir). Soru Sor Agent'ı aynı anahtarı "SSS Bilgi Bankası" aracı olarak okur (retrieve-as-tool, topK 4); sorgu embedding modeli yükleme akışıyla aynı olmalı. Anthropic'in embedding API'si yok, bu yüzden embedding Gemini. Simple Vector Store n8n belleğinde: n8n yeniden başlarsa SSS'yi formdan tekrar yükle.
- Yayın asıl adresi Vercel: https://atolyekart-rose.vercel.app (GitHub Pages'te backend olmadığı için formlar çalışmaz).
- Renkler BizCard'ın sarı/siyah paletinden (`Bizcard v1/tokens.css`), `src/index.css` başındaki değişkenlerde. Koda sabit renk yazma, değişken kullan. Sarı (`--primary`) yalnızca dolgu; üstündeki yazı `--on-primary` (siyah). Koyu tema `prefers-color-scheme` ile.
- Webhook payload sözleşmesi (alan adları değiştirilmez):
  - Sipariş: `event, name, productId, productName, phone, email, quantity, source`
  - Stok bildirimi: `event, name, productId, productName, email, source`
  - Soru: `event: "question_asked", question (3–500 karakter), sessionId, source`

