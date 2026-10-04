// Tüm ürünlerde aynı boyutta çerçeve; resim orantısı bozulmadan içine sığar.
export default function ProductImage({ src, alt }) {
  return (
    <div className="frame">
      <img src={src} alt={alt} loading="lazy" />
    </div>
  )
}
