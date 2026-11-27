# Hafta 6 — Kanıtlar ve kısa not

n8n Cloud (ryazici.app.n8n.cloud), test tarihi 27.11.2026.

## 6.1 Sohbet geçmişi (Redis)

- Site: `AskQuestion` ziyaretçi kimliğini (`sessionId`) ve görünen yazışmayı `localStorage`'da tutar. Sayfa yenilense ya da ziyaretçi sonra dönse de aynı kimlik gider; "Yeni sohbet" butonu ikisini sıfırlar. 30 günden eski yazışma açılışta silinir.
- n8n: "Soru Sor → AI Agent" akışında hafıza Simple Memory'den **Redis Chat Memory**'ye taşındı (Upstash Redis, Frankfurt; n8n kimlik bilgisi "Upstash Redis"). Anahtar `atolyekart:sohbet:<sessionId>`, son 10 etkileşim, TTL 30 gün. Yayın: "Soru Sor v10".

Test (canlı webhook, ayrı HTTP istekleri):

| Ziyaretçi | Soru | Yanıt |
|---|---|---|
| A | Kedimin portresini yaptırmak istiyorum, fiyatı ne kadar? | 750 ₺'den başlar, A3 +400 ₺, kesin fiyat görüşmede |
| A | Az önce sorduğum şey kaç günde hazır olur? | "Karakalem portre … 7–10 iş günü" — önceki soruyu Redis'ten hatırladı |
| B (yeni kimlik) | Az önce sorduğum şey kaç günde hazır olur? | "Önceki mesajını göremiyorum…" — başka ziyaretçinin geçmişi karışmadı |

Simple Memory n8n belleğindeydi, n8n yeniden başlayınca sohbetler siliniyordu; Redis'te 30 gün kalıyor.

## 6.2 n8n MCP

Claude Code'a bağlı n8n MCP sunucusu (instance MCP) üzerinden "AtölyeKart — Soru Sor → AI Agent" akışı çalıştırıldı. Akış ayarlarında "Available in MCP" açık.

| Adım | MCP aracı | Sonuç |
|---|---|---|
| Akışı bul | `search_workflows` | `zmrYERQl9WTgtkyS`, `availableInMCP: true` |
| Çalıştır | `execute_workflow` (production, `Soru Webhook`'a `question_asked` gövdesi) | execution **942**, başarılı, 3.8 sn |
| Sonucu oku | `get_workflow_execution` | Agent "Özel Sipariş Rehberi" aracını çağırdı; yanıt rehberdeki fotoğraf koşulları |

Soru: "Portre için nasıl bir fotoğraf göndermeliyim?" — Yanıt: net yüz, gün ışığı, en az 1500 piksel; kişiler ayrı fotoğraflarda olabilir; fotoğraflar iş bitince silinir.

Aynı MCP ile sipariş akışının bu haftaki execution'ları da sorgulandı (`search_workflow_executions`, `startedAfter` = pazartesi 00:00 TR): **0**. Son sipariş 15.11.2026'da.

## 6.3 n8n API

`npm run n8n:haftalik` → `scripts/n8n-haftalik-siparis.mjs`. n8n public API'den (`GET /api/v1/executions?workflowId=…`) sipariş akışının bu haftaki execution'larını çeker; başarılı canlı (webhook) execution = sipariş, hata = doğrulamaya takılan istek, elle çalıştırmalar sayılmaz. Anahtar `.env.local`'daki `N8N_API_KEY` (yalnızca yerel, `VITE_` öneki yok, Vercel'e eklenmez).

Çıktı (27.11.2026):

```
Hafta başlangıcı: 23 Kasım Pazartesi 00:00 (Türkiye saati)
Bu hafta gelen sipariş: 0
Doğrulamaya takılan istek: 0
Elle/test çalıştırma (sayılmadı): 0
```

MCP sorgusuyla (6.2) aynı sonuç. Son sipariş execution'ı 15.11.2026'da (execution 658).
