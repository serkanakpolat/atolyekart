import { useMemo } from 'react'
import QRCode from 'qrcode'

// Gerçek QR kodu (BizCard'daki bileşenle aynı yaklaşım): hata düzeltme seviyesi M,
// tek bir <path> olarak çizilir; sessiz alan .qr__code dolgusundan gelir.
export default function QrCode({ value, size = 160, label }) {
  const { d, n } = useMemo(() => {
    const qr = QRCode.create(value, { errorCorrectionLevel: 'M' })
    const { size: count, data } = qr.modules
    let path = ''
    for (let y = 0; y < count; y++) {
      for (let x = 0; x < count; x++) {
        if (data[y * count + x]) path += `M${x} ${y}h1v1h-1z`
      }
    }
    return { d: path, n: count }
  }, [value])

  return (
    <svg viewBox={`0 0 ${n} ${n}`} width={size} height={size} role="img" aria-label={label} shapeRendering="crispEdges">
      <path d={d} />
    </svg>
  )
}
