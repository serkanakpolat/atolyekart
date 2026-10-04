import QrCode from './QrCode.jsx'

// Kataloğun adresi: yayına alınınca .env.local'de VITE_SITE_URL verilir;
// yoksa sayfanın o anki adresi kullanılır.
const catalogUrl = import.meta.env.VITE_SITE_URL || window.location.origin + window.location.pathname

export default function CatalogQr() {
  return (
    <section className="qr" aria-labelledby="qr-title">
      <div className="qr__code">
        <QrCode value={catalogUrl} label="Kataloğun QR kodu" />
      </div>
      <div className="qr__text">
        <h2 id="qr-title">Kataloğu telefonunda aç</h2>
        <p>Kamerayla okut, ürünlere telefondan göz at ya da bir arkadaşına göster.</p>
      </div>
    </section>
  )
}
