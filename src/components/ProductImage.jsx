// Görsel yolları (/urunresimleri/...) sitenin alt yoluna göre çözülür (GitHub Pages: /atolyekart/).
const withBase = (path) => import.meta.env.BASE_URL + path.replace(/^\//, '')

// Tüm ürünlerde aynı boyutta çerçeve; resim orantısı bozulmadan içine sığar.
export default function ProductImage({ src, alt }) {
  return (
    <div className="frame">
      <img src={withBase(src)} alt={alt} loading="lazy" />
    </div>
  )
}
