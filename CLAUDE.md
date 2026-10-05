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
- Webhook: payload kurucuları ve gönderim `src/lib/webhook.js`'te; URL `.env.local` içindeki `VITE_WEBHOOK_URL` (git'e girmez). `productId`/`productName` ürünün `id`/`name` alanından gelir.
- Renkler BizCard'ın sarı/siyah paletinden (`Bizcard v1/tokens.css`), `src/index.css` başındaki değişkenlerde. Koda sabit renk yazma, değişken kullan. Sarı (`--primary`) yalnızca dolgu; üstündeki yazı `--on-primary` (siyah). Koyu tema `prefers-color-scheme` ile.
- Webhook payload sözleşmesi (alan adları değiştirilmez):
  - Sipariş: `event, name, productId, productName, phone, email, quantity, source`
  - Stok bildirimi: `event, name, productId, productName, email, source`

