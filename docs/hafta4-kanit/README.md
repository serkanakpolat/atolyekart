# Hafta 4 — Kanıtlar ve kısa not

n8n Cloud (ryazici.app.n8n.cloud), test tarihi 15.11.2026. Kayıtlar "AtölyeKart Siparişler" e-tablosunda.

| Akış | Ne yapar |
|---|---|
| AtölyeKart — Ortak Doğrulama (Sub-workflow) | Katalogu `GET /api/products`'tan alır; e-posta biçimini ve ürün ID'sini kontrol eder. Geçersizse **Stop and Error**. |
| AtölyeKart — Sipariş → Sheet + AI Teşekkür Maili | Hafta 3 akışı; artık webhook'tan hemen sonra sub-workflow'u çağırıyor. |
| AtölyeKart — Stok Bildirimi → AI Alternatif Öneri | Sub-workflow'u çağırır → AI Agent (Gemini + `urun_katalogu` HTTP aracı) stoktaki alternatifi önerir → "Stok Talepleri" sekmesi. |
| AtölyeKart — Hata Yakalayıcı (Error Handler) | İki ana akışın Error Workflow'u. Hatayı "Hatalar" sekmesine yazar (akış, execution, node, mesaj, link). |
| AtölyeKart — Günlük Sipariş Özeti (ürüne göre) | Her gün 21:00 (ve elle): siparişleri okur → **Code** ile bugünkileri ürüne göre gruplar → **Merge** ile katalog bilgisini ekler → **Loop** ile her ürün için "Günlük Özet" satırı yazar → günün toplamı. |

## 1. Ürüne göre günlük özet (zorunlu)

Görseller: `1-gunluk-ozet-execution-649.jpg`, `2-sheet-gunluk-ozet.jpg`. Execution 649, "Günün Toplamı" çıktısı:

```json
{
  "ozetTarihi": "15.11.2026",
  "urunSayisi": 2,
  "toplamSiparis": 4,
  "toplamAdet": 5,
  "toplamCiro": "3.750 ₺",
  "enCokSatan": "Algı — İkili Karakalem Seti (3 adet)",
  "satirlar": [
    "Algı — İkili Karakalem Seti: 2 sipariş, 3 adet, 2.250 ₺",
    "Anime Kahramanı — Karakalem Portre: 2 sipariş, 2 adet, 1.500 ₺"
  ]
}
```

## 2. Sub-workflow iki akıştan çağrılıyor (zorunlu)

Görseller: `3-ortak-dogrulama-subworkflow.jpg`, `4-siparis-akisi-subworkflow-cagrisi.jpg` ve `5-stok-akisi-subworkflow-ai-agent.jpg`. İki akışta da "Ortak Doğrulama" node'u aynı workflow'u (3ULqXT8B0Lz5824q) çağırıyor.

## 3. Geçersiz ürün ID'si Error Handler'a düşüyor (zorunlu)

İstek n8n webhook'una doğrudan gönderildi. Sitenin kendi backend'i (`api/_validate.js`) bilinmeyen ürünü zaten reddediyor; bu yüzden senaryo, Vercel doğrulamasını atlayıp webhook'a doğrudan gelen bir isteği temsil ediyor.

- Sipariş, `productId: "olmayan-urun-999"`: execution 636 → `Doğrulama başarısız (order_created): bilinmeyen ürün ID'si: "olmayan-urun-999"`. Error Handler execution'ı 640 (`6-…`, `7-…`). Tekrar çalıştırmada execution 650 → "Hatalar" sekmesinin 4. satırı (`8-sheet-hatalar-sekmesi.jpg`).
- Stok bildirimi, `email: "gecersiz-eposta@"`: execution 638/652 → `e-posta geçersiz`. "Hatalar" sekmesinin 2. ve 3. satırları.

## 4. AI Agent alternatif ürün önerisi (ileri seviye)

Görsel: `9-sheet-stok-talepleri-ai-oneri.jpg`. Execution 634. Stokta olmayan "Bisikletli — Ahşap Figür" istendi; Agent `urun_katalogu` aracını bir kez çağırdı:

> **Önerilen:** Algı — İkili Karakalem Seti (750 ₺); Anime Kahramanı — Karakalem Portre (750 ₺)
>
> Merhaba Ayşe Hanım, ilgilendiğiniz "Bisikletli — Ahşap Figür" ürünü şu an stoklarımızda kalmamıştır; ürün tekrar stoğa girdiğinde size memnuniyetle haber vereceğiz. Şu anda ahşap oyma kategorimizde stoklu el yapımı ürün bulunmadığından, alternatif olarak atölyemizin özgün el emeği eserlerinden Algı — İkili Karakalem Seti (750 ₺) ve Anime Kahramanı — Karakalem Portre (750 ₺) çalışmalarını inceleyebilirsiniz; bu özel çizimler de yaşam alanlarınıza zanaatın sıcaklığını taşıyacaktır. Ayrıca arzuladığınız isim ve motif oyma ya da kişiye özel portre resim siparişleriniz için bizimle her zaman iletişime geçebilirsiniz.

Aynı kategoride stokta ürün olmadığını kendisi fark edip kategori dışına çıktı ve kişiye özel siparişi hatırlattı.

## Yan bulgu: eşzamanlı siparişler Sheet'te kayboluyordu

Aynı saniyede gelen 3 test siparişinden yalnızca biri Sheet'te kaldı. n8n'in Google Sheets "Append" işlemi varsayılanda boş satırı kendisi hesaplıyor, bu yüzden aynı anda çalışan execution'lar aynı satıra yazıyor. Hafta 3'teki akışta da bu hata vardı; tek tek test edildiği için görünmemişti. Dört akıştaki tüm append node'larında "Minimise API Calls" (`useAppend`) açıldı: bu seçenek Sheets API'nin atomik `append` çağrısını kullanıyor. Tekrar testte aynı anda gelen 3 sipariş (AK-643/644/645) eksiksiz yazıldı.

## Kısa düşünce

**Sub-workflow'a taşımak akışı gerçekten sadeleştirdi mi?**

Ana akışlar açısından evet. Sipariş ve stok akışlarında doğrulama artık tek bir "Ortak Doğrulama" kutusu; e-posta kuralı ya da katalog kontrolü değişirse tek yerde değişiyor ve iki akış aynı kurala bağlı kalıyor. Hata da tek bir biçimde ("Doğrulama başarısız (olay): neden") Error Handler'a düşüyor. Bedeli ise görünmezlik: bir execution'ı incelerken doğrulamanın içini görmek için ayrı bir execution'a geçmek gerekiyor. Ayrıca n8n 2.x'te sub-workflow yayınlanmadan (Publish) çağıran akış onun eski hâlini kullanıyor. İki akış ve tek bir kural seti için kazanç küçük ama gerçek; asıl değeri, üçüncü bir form (örn. özel sipariş) eklendiğinde doğrulamanın baştan yazılmayacak olması.
