// n8n public API ile "bu hafta kaç sipariş geldi?" sorgusu.
// Sipariş akışının (AtölyeKart — Sipariş → Sheet + AI Teşekkür Maili) bu haftaki execution'larını sayar:
// başarılı her canlı (webhook) execution bir sipariştir; hata alanlar doğrulamaya takılan isteklerdir.
//
// Çalıştırma: npm run n8n:haftalik   (anahtar .env.local'daki N8N_API_KEY; yalnızca yerelde, VITE_ öneki yok)

const BASE = process.env.N8N_BASE_URL || 'https://ryazici.app.n8n.cloud'
const ORDER_WORKFLOW_ID = 'woEhJkzzqhc4ieiA'
const API_KEY = process.env.N8N_API_KEY

if (!API_KEY) {
  console.error('N8N_API_KEY tanımlı değil. n8n > Settings > n8n API ekranından anahtar oluşturup .env.local dosyasına ekle.')
  process.exit(1)
}

// Hafta Türkiye saatiyle (UTC+3, yaz saati yok) pazartesi 00:00'da başlar.
function weekStartIstanbul(now = new Date()) {
  const tr = new Date(now.getTime() + 3 * 60 * 60 * 1000)
  const daysSinceMonday = (tr.getUTCDay() + 6) % 7
  const mondayTr = Date.UTC(tr.getUTCFullYear(), tr.getUTCMonth(), tr.getUTCDate() - daysSinceMonday)
  return new Date(mondayTr - 3 * 60 * 60 * 1000)
}

async function api(path) {
  const res = await fetch(`${BASE}/api/v1${path}`, { headers: { 'X-N8N-API-KEY': API_KEY, Accept: 'application/json' } })
  if (res.status === 401) throw new Error('n8n API anahtarı geçersiz ya da süresi dolmuş (401).')
  if (!res.ok) throw new Error(`n8n API ${res.status}: ${(await res.text()).slice(0, 200)}`)
  return res.json()
}

// Execution'lar en yeniden eskiye gelir; hafta başından eskisine ulaşınca sayfalamayı bırakır.
async function executionsSince(since) {
  const list = []
  let cursor
  do {
    const qs = new URLSearchParams({ workflowId: ORDER_WORKFLOW_ID, limit: '100' })
    if (cursor) qs.set('cursor', cursor)
    const page = await api(`/executions?${qs}`)
    for (const ex of page.data) {
      if (new Date(ex.startedAt) < since) return list
      list.push(ex)
    }
    cursor = page.nextCursor
  } while (cursor)
  return list
}

const since = weekStartIstanbul()
const executions = await executionsSince(since)
const live = executions.filter((ex) => ex.mode === 'webhook')
const orders = live.filter((ex) => ex.status === 'success')
const rejected = live.filter((ex) => ex.status === 'error' || ex.status === 'crashed')

const day = new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', weekday: 'long', day: 'numeric', month: 'long' })
const byDay = new Map()
for (const ex of orders) {
  const key = day.format(new Date(ex.startedAt))
  byDay.set(key, (byDay.get(key) || 0) + 1)
}

console.log(`Hafta başlangıcı: ${day.format(since)} 00:00 (Türkiye saati)`)
console.log(`Bu hafta gelen sipariş: ${orders.length}`)
for (const [d, n] of [...byDay].reverse()) console.log(`  ${d}: ${n}`)
console.log(`Doğrulamaya takılan istek: ${rejected.length}`)
console.log(`Elle/test çalıştırma (sayılmadı): ${executions.length - live.length}`)
