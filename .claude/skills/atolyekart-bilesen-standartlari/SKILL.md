---
name: atolyekart-bilesen-standartlari
description: AtölyeKart (Ahşap ve Karakalem Atölyesi) React bileşen standartları — yeni bileşen yazarken, mevcut bileşeni değiştirirken, ürün kartı/katalog/form/dialog/stil işlerinde kullan. Dosya yapısı, prop akışı, renk değişkenleri, erişilebilirlik ve Türkçe metin kurallarını içerir.
---

# AtölyeKart bileşen standartları

Bu projede bir React bileşeni yazmadan ya da değiştirmeden önce bu kurallara uy. Kurala uymayan bir istek gelirse uygula ama hangi kuralı esnettiğini söyle.

## Dosya ve isim
- Bileşenler `src/components/` altında, **PascalCase** `.jsx` dosyası, dosya başına tek `export default function`.
- Bileşen olmayan mantık: `src/lib/` (ör. `webhook.js`). Tekrar kullanılan React mantığı: `useXxx.js` hook'u.
- Veri `src/data/` altında; bileşenin içine ürün verisi yazılmaz.

## Veri ve prop akışı
- Ürün alanları sabit: `id, name, category, price, description, image, imageAlt, inStock`. Alan adı değiştirme, yeni alanı önce CLAUDE.md'ye ekle.
- Durum (state) en yakın ortak ebeveynde tutulur. Seçili ürün + açık form `App.jsx`'te (`activeForm`).
- Aşağı prop, yukarı callback: `onOrder(product)`, `onNotify(product)`. 2–3 seviyeyi geçmedikçe Context kullanma.
- Listelerde `key={product.id}` — index değil.

## Stil
- Tüm stiller `src/index.css`; sınıf adları kebab-case, alt parçalar `blok__parca`, varyantlar `blok--varyant` (ör. `btn--primary`).
- **Renk kodu yazma**, `:root` değişkenlerini kullan (`--ink`, `--muted`, `--line`, `--primary`, `--frame`, `--mat`…). Yeni renk gerekiyorsa önce `:root`'a ve koyu tema bloğuna ekle.
- Sarı `--primary` yalnızca **dolgu**; üstündeki yazı `--on-primary`. Sarıyı yazı rengi yapma.
- Ürün görseli her zaman `ProductImage` (4:3 ceviz çerçeve) içinden; görsel orantısı bozulmaz (`object-fit: contain`).
- Hareket: kısa (≤0.45 sn), ease-out; `prefers-reduced-motion` için kapatma kuralı ekle.

## Erişilebilirlik
- Tıklanan her şey `<button type="button">` ya da `<a>`; `div` onClick yok.
- Dokunma hedefi en az 44px; odak halkası `:focus-visible` ile `--focus` renginde.
- Her `<img>` anlamlı `alt` (ürünün `imageAlt` alanı). Sadece ikon olan butona `aria-label`.
- Form alanları `<label>` içinde; native doğrulama (`required`, `type="email"`, `type="tel"`, `min`).
- Pencereler native `<dialog>` (`FormDialog`); Esc ile kapanır, ilk alan `autoFocus`.

## Metin
- Arayüz Türkçe, samimi "sen" dili; abartılı pazarlama yok. Ton için CLAUDE.md'deki atölye tanımına bak.
- Fiyat `Intl.NumberFormat('tr-TR')` + ` ₺` (ör. `1.500 ₺`).
- Butonlar eylemi söyler ("Sipariş Ver", "Gelince Haber Ver"); hata mesajı sorunu ve çözümü söyler.

## Bitirmeden önce
1. `npm run build` hatasız.
2. Açık ve koyu temada, masaüstü ve telefon genişliğinde göz at.
3. `products.js` ve payload alan adlarına istenmeden dokunulmadığını kontrol et.
