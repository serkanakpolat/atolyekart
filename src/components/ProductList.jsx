import ProductCard from './ProductCard.jsx'

export default function ProductList({ products, onOrder, onNotify }) {
  return (
    <main className="catalog">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onOrder={onOrder} onNotify={onNotify} />
      ))}
    </main>
  )
}
