import ProductImage from './ProductImage.jsx'

const priceFormat = new Intl.NumberFormat('tr-TR')

export default function ProductCard({ product, onOrder, onNotify }) {
  return (
    <article className="product">
      <ProductImage src={product.image} alt={product.imageAlt} />
      <div className="product__meta">
        <span className="category">{product.category}</span>
        {!product.inStock && <span className="badge">Tükendi</span>}
      </div>
      <h2>{product.name}</h2>
      <p>{product.description}</p>
      <div className="product__footer">
        {product.inStock ? (
          <button type="button" className="btn btn--primary" onClick={() => onOrder(product)}>
            Sipariş Ver
          </button>
        ) : (
          <button type="button" className="btn btn--secondary" onClick={() => onNotify(product)}>
            Gelince Haber Ver
          </button>
        )}
        <span className="price">{priceFormat.format(product.price)} ₺</span>
      </div>
    </article>
  )
}
