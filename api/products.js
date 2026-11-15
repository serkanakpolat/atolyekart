// Herkese açık ürün kataloğu (salt okunur). n8n akışları ürün ID doğrulaması,
// günlük özetteki ürün bilgisi ve AI Agent'ın alternatif öneri aracı için buradan okur.
// Tek kaynak src/data/products.js; görsel yolları gibi arayüz alanları dışarı verilmez.
import { products } from '../src/data/products.js'

const catalog = products.map(({ id, name, category, price, description, inStock }) => ({
  id,
  name,
  category,
  price,
  description,
  inStock,
}))

export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  if (req.method !== 'GET') {
    res.statusCode = 405
    return res.end(JSON.stringify({ error: 'Yalnızca GET' }))
  }
  res.setHeader('Cache-Control', 'public, max-age=60')
  res.statusCode = 200
  res.end(JSON.stringify(catalog))
}
