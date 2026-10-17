import { useState } from 'react'
import ProductList from './components/ProductList.jsx'
import FormDialog from './components/FormDialog.jsx'
import OrderForm from './components/OrderForm.jsx'
import StockNotifyForm from './components/StockNotifyForm.jsx'
import CatalogQr from './components/CatalogQr.jsx'
import CategoryFilter from './components/CategoryFilter.jsx'
import { products } from './data/products.js'

// Kategoriler veriden çıkarılır; yeni kategori eklemek için yalnızca products.js'e ürün eklemek yeter.
const categories = [...new Set(products.map((p) => p.category))]

export default function App() {
  // Seçili ürün + hangi form: { type: 'order' | 'stock', product } | null
  const [activeForm, setActiveForm] = useState(null)
  const closeForm = () => setActiveForm(null)
  // Seçili kategori; null = hepsi
  const [category, setCategory] = useState(null)
  const visibleProducts = category ? products.filter((p) => p.category === category) : products

  return (
    <>
      <header className="site-header">
        <h1>Ahşap ve Karakalem Atölyesi</h1>
        <p>Elde kesilmiş ahşap figürler ve özgün karakalem çizimler</p>
      </header>

      <CategoryFilter categories={categories} selected={category} onSelect={setCategory} />

      <ProductList
        products={visibleProducts}
        onOrder={(product) => setActiveForm({ type: 'order', product })}
        onNotify={(product) => setActiveForm({ type: 'stock', product })}
      />

      {activeForm?.type === 'order' && (
        <FormDialog title="Sipariş Ver" onClose={closeForm}>
          <OrderForm product={activeForm.product} onDone={closeForm} />
        </FormDialog>
      )}
      {activeForm?.type === 'stock' && (
        <FormDialog title="Stok Bildirimi İste" onClose={closeForm}>
          <StockNotifyForm product={activeForm.product} onDone={closeForm} />
        </FormDialog>
      )}

      <CatalogQr />

      <footer className="site-footer">
        Her ürün tek tek, elde üretilir. © Ahşap ve Karakalem Atölyesi
      </footer>
    </>
  )
}
